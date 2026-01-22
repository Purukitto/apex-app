package com.purukitto.apex;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.purukitto.apex.discord.DiscordRpcPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DiscordRpcPlugin.class);
        super.onCreate(savedInstanceState);
        
        // Keep screen on (optional, for ride recording)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
