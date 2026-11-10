import { Config } from "@remotion/cli/config";

// 3D (three.js) precisa de WebGL no render headless.
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
