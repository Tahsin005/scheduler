import cron from "node-cron";
import Post from "../models/Post.js";
import Account from "../models/Account.js";
import zernio from "../config/zernio.js";
import ActivityLog from "../models/ActivityLog.js";

export const initScheduler = () => {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const postsToPublish = await Post.find({
                status: "scheduled", scheduledFor: { $lte: now }
            });

            for (const post of postsToPublish) {
                try {
                    const claimedPost = await Post.findOneAndUpdate(
                        { _id: post._id, status: "scheduled" },
                        { status: "publishing" },
                        { returnDocument: "after" }
                    );

                    if (!claimedPost) {
                        continue;
                    }

                    const accounts = await Account.find({
                        user: claimedPost.user,
                        platform: {
                            $in: claimedPost.platforms,
                        },
                        status: "connected",
                        zernioAccountId: {
                            $exists: true
                        }
                    });

                    if (accounts.length === 0) {
                        console.log(`No connected Zernio accounts found for post: ${claimedPost._id}`);
                        claimedPost.status = "failed";
                        await claimedPost.save();
                        continue;
                    }

                    const zernioPlatforms = accounts.map((acc) => ({
                        platform: acc.platform as any,
                        accountId: acc.zernioAccountId!
                    }));

                    const payload = {
                        content: claimedPost.content,
                        publishNow: true,
                        ...(claimedPost.mediaUrl ? {
                            mediaItems: [{
                                type: claimedPost.mediaType || "image",
                                url: claimedPost.mediaUrl
                            }]
                        } : {}),
                        platforms: zernioPlatforms,
                    };

                    console.log(`Publishing post ${claimedPost._id} to Zernio with media: ${claimedPost.mediaUrl || "none"}`);

                    const response = await zernio.posts.createPost({
                        body: payload
                    });

                    const publishedPost = (response.data as any)?.post || response.data;

                    if (!publishedPost) {
                        throw new Error("Failed to get post object from Zernio response");
                    }

                    console.log(`Zernio post created: ${publishedPost._id || publishedPost.id}`);

                    claimedPost.status = "published";
                    await claimedPost.save();

                    await ActivityLog.create({
                        user: claimedPost.user,
                        actionType: "POST_PUBLISHED",
                        description: `Published post to ${accounts.map((a) => a.platform).join(", ")}`,
                        relatedPost: claimedPost._id,
                    });
                } catch (err: any) {
                    console.error(`Failed to publish post ${post._id}: `, err?.response?.data || err?.message);
                    await Post.findByIdAndUpdate(post._id, { status: "failed" });
                }
            }

            if (postsToPublish.length > 0) {
                console.log(`Evaluated ${postsToPublish.length} posts at ${now.toISOString()}`);
            }
        } catch (error) {
            console.error("Error in scheduler:", error);
        }
    });

    console.log("Scheduler service initiated");
};