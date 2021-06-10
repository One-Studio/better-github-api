# 开发文档亟踩坑总结

- 获取KV值

```
const value = await FIRST_KV_NAMESPACE.get("first-key")
```

- 设置键值

```
await NAMESPACE.put(key, value)
```

- 跳转

```
return fetch("网址");
```

- 返回数据

```
return new Response(数据);
```

- 重定向 301 302 等

```
Response.redirect(newUrl, 302);
```

- 返回JSON序列化的数据，同时指定headers和status状态

```
return new Response(JSON.stringify({ pathname }), {
  headers: { "Content-Type": "application/json" },
  status: 200, //200-成功 400-请求无效
});
```

## 待定内容&草稿

键为`hlae-installer`

```
{"repo": "advancedfx/advancedfx","filter": "&HLAE_Setup&&&.exe","info": {"zh_CN": "hlae的exe安装器","zh_TW": "hlae的exe安裝器"}}
```

csdm

```
{"repo": "akiver/CSGO-Demos-Manager","filter": "&&&&.zip","info": {"zh_CN": "CSGO录像观看工具"}}
```

hlae-studio

```
{"repo": "One-Studio/HLAE-Studio","filter": "&HLAE-Studio&&&.exe","info": {"zh_CN": "CSGO录像观看工具"}}
```



## 键值对内容（待定、未完成）

| 键             | 值                                                  |
| -------------- | --------------------------------------------------- |
| hlae           | advancedfx/advancedfx  &hlae%%%.zip                 |
| hlae-installer | advancedfx/advancedfx  &HLAE_Setup.exe              |
| csdm           | akiver/CSGO-Demos-Manager  &csgo-demos-manager .exe |
| ffmpeg-mac     |                                                     |
| ffmpeg-mac     |                                                     |
| ffmpeg-linux   |                                                     |
| ffmpeg-linux   |                                                     |
| ffmpeg-win     |                                                     |
| ffmpeg-win     |                                                     |
| x264           |                                                     |
| x265           |                                                     |
| one-encoder    |                                                     |
|                |                                                     |

ffmpeg

Ffmpeg-win

ffmpeg-win-x64-git

```
{"repo": "GyanD/codexffmpeg","filter": "&&&&full_build.7z","info": {"zh_CN": "FFMPEG Windows x86 64位 Gyan完整库编译"}}
```

架构处 x64 ia32 arm64 ...

| ffmpeg | arch 默认amd64   | 默认git | win64特有 默认full |
| ------ | ---------------- | ------- | ------------------ |
| Win    | Amd64            | git     | Full               |
|        | Arm64            | release | Essentials         |
|        |                  |         |                    |
| Mac    | Amd64            | git     |                    |
|        | Arm64 (暂时没有) | release |                    |
|        |                  |         |                    |
| Linux  | Amd64            | git     | 无                 |
|        | I686             | release |                    |
|        | Arm64            |         |                    |
|        | Armhf            |         |                    |
|        | Armel            |         |                    |
|        |                  |         |                    |

```
https://api.upup.cool/get/ffmpeg/win
https://api.upup.cool/get/ffmpeg/win/amd64/git
https://api.upup.cool/get/ffmpeg/mac
https://api.upup.cool/get/ffmpeg/mac/amd64/git
https://api.upup.cool/get/ffmpeg/mac/arm64/git
https://api.upup.cool/get/ffmpeg/linux/amd64/git
https://api.upup.cool/get/ffmpeg/amd/amd/release
```

| X264           |            |      |      |
| -------------- | ---------- | ---- | ---- |
| win64          | amd64      |      |      |
| win32          | Ia32       |      |      |
| debian-amd64   |            |      |      |
| debian-aarch64 |            |      |      |
| macos-arm64    |            |      |      |
| macos-x86_64   | amd64      |      |      |
| macos          | 可能是ia32 |      |      |
|                |            |      |      |

```
https://api.upup.cool/get/x264/win/amd64
https://api.upup.cool/get/x264/win/ia32
https://api.upup.cool/get/x264/debian/amd64
https://api.upup.cool/get/x264/debian/aarch64
https://api.upup.cool/get/x264/mac/amd64
```



```
https://api.upup.cool/get/hlae
https://github.com/仓库名/archive/refs/tags/版本号.zip  //source下载
https://github.com/One-Studio/HLAE-Studio/archive/refs/heads/main.zip
```

