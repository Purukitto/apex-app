package com.purukitto.apex.discord;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.content.pm.ServiceInfo;
import android.os.IBinder;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class DiscordRpcService extends Service {
    private static final String TAG = "DiscordRpc";
    static final String ACTION_CONNECT = "com.purukitto.apex.discord.CONNECT";
    static final String ACTION_UPDATE = "com.purukitto.apex.discord.UPDATE";
    static final String ACTION_CLEAR = "com.purukitto.apex.discord.CLEAR";
    static final String ACTION_DISCONNECT = "com.purukitto.apex.discord.DISCONNECT";
    static final String EXTRA_TOKEN = "extra_token";
    static final String EXTRA_DETAILS = "extra_details";
    static final String EXTRA_STATE = "extra_state";

    private static final String CHANNEL_ID = "discord_rpc";
    private static final int NOTIFICATION_ID = 4127;

    private DiscordGatewayClient gatewayClient;

    @Override
    public void onCreate() {
        super.onCreate();
        gatewayClient = new DiscordGatewayClient();
        Log.d(TAG, "Service created");
        ensureNotificationChannel();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            );
        } else {
            startForeground(NOTIFICATION_ID, buildNotification());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) {
            return START_NOT_STICKY;
        }
        String action = intent.getAction();
        Log.d(TAG, "Service action: " + action);
        if (ACTION_CONNECT.equals(action)) {
            String token = intent.getStringExtra(EXTRA_TOKEN);
            if (token != null && !token.isEmpty()) {
                Log.d(TAG, "Connecting with token");
                gatewayClient.connect(token);
            }
        } else if (ACTION_UPDATE.equals(action)) {
            String details = intent.getStringExtra(EXTRA_DETAILS);
            String state = intent.getStringExtra(EXTRA_STATE);
            Log.d(TAG, "Updating presence");
            gatewayClient.updatePresence(details, state);
        } else if (ACTION_CLEAR.equals(action)) {
            Log.d(TAG, "Clearing presence");
            gatewayClient.clearPresence();
        } else if (ACTION_DISCONNECT.equals(action)) {
            Log.d(TAG, "Disconnecting presence");
            gatewayClient.clearPresence();
            gatewayClient.disconnect();
            stopForeground(true);
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Service destroyed");
        gatewayClient.disconnect();
        super.onDestroy();
    }

    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Discord RPC",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Discord RPC")
            .setContentText("Updating ride presence")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setOngoing(true)
            .build();
    }
}
