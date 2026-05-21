import Pusher from "pusher";
import { quizChannel, type RealtimeEventName, type RealtimeEvents } from "@/lib/realtime-events";

let pusher: Pusher | null = null;

function getPusher() {
  if (pusher) {
    return pusher;
  }

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    return null;
  }

  pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true
  });

  return pusher;
}

export async function publishRealtimeEvent<Name extends RealtimeEventName>(
  quizCode: string,
  eventName: Name,
  payload: RealtimeEvents[Name]
) {
  const client = getPusher();

  if (!client) {
    return;
  }

  await client.trigger(quizChannel(quizCode), eventName, payload);
}
