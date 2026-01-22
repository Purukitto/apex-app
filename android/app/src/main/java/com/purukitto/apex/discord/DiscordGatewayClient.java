package com.purukitto.apex.discord;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.Nullable;
import java.util.Timer;
import java.util.TimerTask;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

class DiscordGatewayClient {
    private static final String TAG = "DiscordRpc";
    private static final String GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

    private final OkHttpClient client = new OkHttpClient();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private WebSocket socket;
    private Timer heartbeatTimer;
    private Integer heartbeatInterval;
    private Integer sequenceNumber;
    private boolean isReady = false;
    private String token;
    private PendingPresence pendingPresence;

    void connect(String token) {
        if (socket != null) {
            Log.d(TAG, "Gateway already connected");
            return;
        }
        this.token = token;
        Request request = new Request.Builder().url(GATEWAY_URL).build();
        socket = client.newWebSocket(request, new GatewayListener());
    }

    void updatePresence(@Nullable String details, @Nullable String state) {
        PendingPresence presence = new PendingPresence(details, state);
        if (!isReady) {
            Log.d(TAG, "Gateway not ready, queueing presence");
            pendingPresence = presence;
            return;
        }
        sendPresence(presence);
    }

    void clearPresence() {
        if (socket == null) {
            Log.d(TAG, "Gateway not connected, skip clear");
            return;
        }
        JSONObject payload = new JSONObject();
        JSONObject data = new JSONObject();
        try {
            payload.put("op", 3);
            data.put("since", JSONObject.NULL);
            data.put("activities", new JSONArray());
            data.put("status", "online");
            data.put("afk", false);
            payload.put("d", data);
        } catch (JSONException ignored) {
            return;
        }
        socket.send(payload.toString());
        Log.d(TAG, "Presence cleared");
    }

    void disconnect() {
        if (heartbeatTimer != null) {
            heartbeatTimer.cancel();
            heartbeatTimer = null;
        }
        if (socket != null) {
            Log.d(TAG, "Disconnecting gateway");
            socket.close(1000, "Disconnect");
            socket = null;
        }
        isReady = false;
        sequenceNumber = null;
        heartbeatInterval = null;
        pendingPresence = null;
    }

    private void handleGatewayMessage(String message) {
        try {
            JSONObject data = new JSONObject(message);
            int op = data.getInt("op");
            if (!data.isNull("s")) {
                sequenceNumber = data.getInt("s");
            }

            switch (op) {
                case 10:
                    heartbeatInterval = data.getJSONObject("d").getInt("heartbeat_interval");
                    identify();
                    startHeartbeat();
                    break;
                case 0:
                    String event = data.optString("t", "");
                    if ("READY".equals(event)) {
                        isReady = true;
                        if (pendingPresence != null) {
                            sendPresence(pendingPresence);
                            pendingPresence = null;
                        }
                    }
                    break;
                case 11:
                    break;
                case 7:
                    String t = this.token;
                    disconnect();
                    connect(t);
                    break;
                case 9:
                    Log.d(TAG, "Invalid session, re-identifying");
                    identify();
                    break;
                default:
                    break;
            }
        } catch (JSONException ignored) {
            Log.d(TAG, "Failed to parse gateway message");
        }
    }

    private void identify() {
        if (socket == null || token == null) {
            Log.d(TAG, "Identify skipped, socket or token missing");
            return;
        }
        try {
            JSONObject payload = new JSONObject();
            JSONObject data = new JSONObject();
            JSONObject props = new JSONObject();
            props.put("$os", "android");
            props.put("$browser", "Apex");
            props.put("$device", "Apex Mobile");

            data.put("token", token);
            data.put("properties", props);
            JSONObject presence = new JSONObject().put("status", "online").put("afk", false);
            data.put("presence", presence);

            payload.put("op", 2);
            payload.put("d", data);
            socket.send(payload.toString());
        } catch (JSONException ignored) {
            Log.d(TAG, "Identify failed");
        }
    }

    private void startHeartbeat() {
        if (heartbeatInterval == null || socket == null) {
            return;
        }
        if (heartbeatTimer != null) {
            heartbeatTimer.cancel();
        }
        heartbeatTimer = new Timer();
        heartbeatTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                sendHeartbeat();
            }
        }, heartbeatInterval, heartbeatInterval);
    }

    private void sendHeartbeat() {
        if (socket == null) {
            return;
        }
        try {
            JSONObject payload = new JSONObject();
            payload.put("op", 1);
            payload.put("d", sequenceNumber == null ? JSONObject.NULL : sequenceNumber);
            socket.send(payload.toString());
        } catch (JSONException ignored) {
        }
    }

    private void sendPresence(PendingPresence presence) {
        if (socket == null) {
            Log.d(TAG, "Presence send skipped, socket missing");
            return;
        }
        try {
            JSONObject payload = new JSONObject();
            JSONObject data = new JSONObject();
            JSONArray activities = new JSONArray();
            JSONObject activity = new JSONObject();
            activity.put("name", "Apex");
            activity.put("type", 0);
            if (presence.details != null) {
                activity.put("details", presence.details);
            }
            if (presence.state != null) {
                activity.put("state", presence.state);
            }
            activities.put(activity);
            data.put("since", JSONObject.NULL);
            data.put("activities", activities);
            data.put("status", "online");
            data.put("afk", false);
            payload.put("op", 3);
            payload.put("d", data);
            socket.send(payload.toString());
        } catch (JSONException ignored) {
            Log.d(TAG, "Presence send failed");
        }
    }

    private class GatewayListener extends WebSocketListener {
        @Override
        public void onOpen(WebSocket webSocket, Response response) {
            Log.d(TAG, "Gateway socket opened");
        }

        @Override
        public void onMessage(WebSocket webSocket, String text) {
            mainHandler.post(() -> handleGatewayMessage(text));
        }

        @Override
        public void onFailure(WebSocket webSocket, Throwable t, Response response) {
            Log.d(TAG, "Gateway failure: " + t.getMessage());
            disconnect();
        }

        @Override
        public void onClosed(WebSocket webSocket, int code, String reason) {
            Log.d(TAG, "Gateway closed: " + code + " " + reason);
            disconnect();
        }
    }

    private static class PendingPresence {
        @Nullable
        final String details;
        @Nullable
        final String state;

        PendingPresence(@Nullable String details, @Nullable String state) {
            this.details = details;
            this.state = state;
        }
    }
}
