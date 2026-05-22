"use server";

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendInDb,
  cancelFriendRequest,
  toggleLikeInDb,
  getCompletionDetails,
  computeActivityLabel,
  getLikersForCompletion,
} from "./queries";
import { sendPushToUser } from "@/src/features/notifications";
import { getUserNotificationPrefs } from "@/src/features/notifications/queries";

export async function requestFriend(input: {
  receiverId: number;
}): Promise<{ success: true; alreadyExists: boolean } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const { receiverId } = input;
  if (!receiverId) return { error: "receiverId required" };

  const result = await sendFriendRequest(user.id, receiverId);

  if (result) {
    const senderName = user.searchHandle
      ? `@${user.searchHandle}`
      : (user.displayName ?? "Someone");
    (async () => {
      const prefs = await getUserNotificationPrefs(receiverId);
      if (prefs?.friend_requests !== false) {
        sendPushToUser(
          receiverId,
          {
            title: "Rhythm",
            body: `${senderName} sent you a friend request`,
            url: "/community",
          },
          "friend_request",
        ).catch(() => {});
      }
    })().catch(() => {});
  }

  updateTag(`requests:${receiverId}`);
  updateTag(`sent-requests:${user.id}`);
  return { success: true, alreadyExists: result === null };
}

export async function acceptFriend(input: {
  requestId: string;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const result = await acceptFriendRequest(input.requestId, user.id);
  if (!result) return { error: "Request not found" };

  const senderId = result.senderId;
  const receiverId = user.id;

  const accepterName = user.searchHandle
    ? `@${user.searchHandle}`
    : (user.displayName ?? "Someone");
  (async () => {
    const prefs = await getUserNotificationPrefs(senderId);
    if (prefs?.friend_requests !== false) {
      sendPushToUser(
        senderId,
        {
          title: "Rhythm",
          body: `${accepterName} accepted your friend request`,
          url: "/community",
        },
        "friend_accepted",
      ).catch(() => {});
    }
  })().catch(() => {});

  updateTag(`friends:${senderId}`);
  updateTag(`friends:${receiverId}`);
  updateTag(`requests:${receiverId}`);
  updateTag(`feed:${senderId}`);
  updateTag(`feed:${receiverId}`);
  updateTag(`suggestions:${senderId}`);
  updateTag(`suggestions:${receiverId}`);

  return { success: true };
}

export async function rejectFriend(input: {
  requestId: string;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const result = await rejectFriendRequest(input.requestId, user.id);
  if (!result) return { error: "Request not found" };

  updateTag(`requests:${user.id}`);
  return { success: true };
}

export async function withdrawFriendRequest(input: {
  receiverId: number;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  await cancelFriendRequest(user.id, input.receiverId);

  updateTag(`sent-requests:${user.id}`);
  updateTag(`requests:${input.receiverId}`);

  return { success: true };
}

export async function toggleLike(input: {
  completionId: string;
}): Promise<{ liked: boolean } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const details = await getCompletionDetails(input.completionId);
  if (!details) return { error: "Activity not found" };
  const ownerId = details.userId;

  const liked = await toggleLikeInDb(user.id, input.completionId);
  updateTag(`likes:${input.completionId}`);

  if (liked && ownerId !== user.id) {
    (async () => {
      const prefs = await getUserNotificationPrefs(ownerId);
      if (prefs?.likes !== false) {
        const senderName = user.searchHandle
          ? `@${user.searchHandle}`
          : (user.displayName ?? "Someone");
        const activityLabel = computeActivityLabel(
          details.taskId,
          details.completionData,
          details.dbTaskType,
        );
        sendPushToUser(
          ownerId,
          { title: "Rhythm", body: `${senderName} liked your ${activityLabel}`, url: "/profile" },
          "like",
        ).catch(() => {});
      }
    })().catch(() => {});
  }

  return { liked };
}

export async function getActivityLikers(input: { completionId: string }): Promise<
  | { likers: { id: number; displayName: string | null; searchHandle: string | null; avatarUrl: string | null }[] }
  | { error: string }
> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  const likers = await getLikersForCompletion(input.completionId);
  return { likers };
}

export async function removeFriend(input: {
  friendId: number;
}): Promise<{ success: true } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const { friendId } = input;
  await removeFriendInDb(user.id, friendId);

  updateTag(`friends:${user.id}`);
  updateTag(`friends:${friendId}`);
  updateTag(`feed:${user.id}`);
  updateTag(`feed:${friendId}`);
  updateTag(`suggestions:${user.id}`);
  updateTag(`suggestions:${friendId}`);

  return { success: true };
}
