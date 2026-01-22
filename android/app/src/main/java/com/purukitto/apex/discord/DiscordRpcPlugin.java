package com.purukitto.apex.discord;

import android.content.Intent;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DiscordRpc")
public class DiscordRpcPlugin extends Plugin {
    private static final String TAG = "DiscordRpc";

    @PluginMethod
    public void connect(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isEmpty()) {
            call.reject("Token is required");
            return;
        }

        Log.d(TAG, "Plugin connect");
        Intent intent = new Intent(getContext(), DiscordRpcService.class);
        intent.setAction(DiscordRpcService.ACTION_CONNECT);
        intent.putExtra(DiscordRpcService.EXTRA_TOKEN, token);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void updatePresence(PluginCall call) {
        Log.d(TAG, "Plugin updatePresence");
        Intent intent = new Intent(getContext(), DiscordRpcService.class);
        intent.setAction(DiscordRpcService.ACTION_UPDATE);
        intent.putExtra(DiscordRpcService.EXTRA_DETAILS, call.getString("details"));
        intent.putExtra(DiscordRpcService.EXTRA_STATE, call.getString("state"));
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void clearPresence(PluginCall call) {
        Log.d(TAG, "Plugin clearPresence");
        Intent intent = new Intent(getContext(), DiscordRpcService.class);
        intent.setAction(DiscordRpcService.ACTION_CLEAR);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        Log.d(TAG, "Plugin disconnect");
        Intent intent = new Intent(getContext(), DiscordRpcService.class);
        intent.setAction(DiscordRpcService.ACTION_DISCONNECT);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }
}
