"use server";

import { updateTag } from "next/cache";
import { getSessionUser } from "@/src/features/auth";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendInDb,
  cancelFriendRequest,
} from "./queries";
import { sendPushToUser } from "@/src/features/notifications";

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
    sendPushToUser(
      receiverId,
      {
        title: "The New Human Project",
        body: `${senderName} sent you a friend request`,
        url: "/community",
      },
      "friend_request",
    ).catch(() => {});
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
