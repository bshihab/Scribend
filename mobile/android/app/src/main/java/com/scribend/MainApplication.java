package com.scribend;
import android.content.res.Configuration;
import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

import android.app.Application;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.hermes.reactexecutor.RuntimeConfig;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.soloader.OpenSourceMergedSoMapping;
import com.facebook.soloader.SoLoader;
import java.io.IOException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost reactNativeHost = new ReactNativeHostWrapper(this, new DefaultReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return new PackageList(this).getPackages();
    }

    @Override
    protected String getJSMainModuleName() {
      return ".expo/.virtual-metro-entry";
    }

    @Override
    protected boolean isNewArchEnabled() {
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }

    @Override
    protected Boolean isHermesEnabled() {
      return BuildConfig.IS_HERMES_ENABLED;
    }

    // On-device Whisper + Llama load large models whose JS-side allocations blow
    // Hermes' default heap cap (intermittent "OOM: Max heap size was exceeded").
    // Raise the Hermes heap so both models can coexist during a visit.
    @Override
    protected JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
      RuntimeConfig config = new RuntimeConfig();
      config.setHeapSizeMB(6144);
      return new HermesExecutorFactory(config);
    }
  });

  @Override
  public ReactNativeHost getReactNativeHost() {
    return reactNativeHost;
  }

  @Override
  public ReactHost getReactHost() {
    return DefaultReactHost.getDefaultReactHost(getApplicationContext(), reactNativeHost);
  }

  @Override
  public void onCreate() {
    super.onCreate();
    try {
      SoLoader.init(this, OpenSourceMergedSoMapping.INSTANCE);
    } catch (IOException e) {
      throw new RuntimeException("Failed to initialize SoLoader", e);
    }
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }
}
