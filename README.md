# better-github-api

> 未完成 by Purp1e

## 简介

基于gh-proxy和cloudflare workers提供github的更好的Serverless API服务，简单易用开销低，速度有保障（CDN）。

----

以下是设计草稿，非最终版

cdn.js是原项目单纯的加速功能

api.js是本项目的核心

# CloudFlare Workers API设计

- 获取KV值

```
const value = await FIRST_KV_NAMESPACE.get("first-key")
```

- 设置键值

```
await NAMESPACE.put(key, value)
```

## 访问API

| 键                                                           | 含义                         |
| ------------------------------------------------------------ | ---------------------------- |
| repo                                                         | 从github仓库获取             |
| bucket（想法是定时让CF去取地址放在键值对里，用bucket秒获得链接，不用解析github api，不知道有无弊端，最后实现） | 获取已缓存到KV的附件、版本号 |
| get                                                          | 实时获取KV对应的附件、版本号 |

- 后面跟version获取版本号，不跟则获取最新版本下载地址。
- 最后一个字段过滤解决多个附件的情况，用 `%` 分隔 include%exclude%start%end，如 `hlae%%%.zip` 代表包含hlae、结尾是.zip的附件。

| API示例                                    | 含义               |
| ------------------------------------------ | ------------------ |
| /repo/advancedfx/advancedfx/`版本号`       |                    |
| /repo/advancedfx/advancedfx/`版本号`/      |                    |
| /repo/advancedfx/advancedfx/latest/version |                    |
| /repo/advancedfx/advancedfx/latest/hlae%   |                    |
| /repo/advancedfx/advancedfx/latest/source  |                    |
| /bucket                                    | 获取所有bucket信息 |
| /bucket/hlae                               | 获取hlae最新安装包 |
| /bucket/hlae/version                       |                    |
| /bucket/ffmpeg/win/                        |                    |
| /bucket/ffmpeg/win/                        |                    |
| /get/hlae                                  |                    |

```
https://api.upup.cool/get/hlae
https://github.com/仓库名/archive/refs/tags/版本号.zip
```

## 键值对值的设计

> Json格式

| 键      | 含义       | 例                    |
| ------- | ---------- | --------------------- |
| repo    | 仓库名     | advancedfx/advancedfx |
| include | 包含字符串 | hlae                  |
| exclude | 排除字符串 |                       |
| start   | 开头字符串 |                       |
| end     | 结尾字符串 | .zip                  |

/hlae%%%.zip  %分隔

若只有repo仓库名且只有一个附件直接返回这个附件

## 键值对内容

| 键             | 值                                                 |
| -------------- | -------------------------------------------------- |
| hlae           | advancedfx/advancedfx  hlae%%%.zip                 |
| hlae-installer | advancedfx/advancedfx  HLAE_Setup.exe              |
| csdm           | akiver/CSGO-Demos-Manager  csgo-demos-manager .exe |
| ffmpeg-mac     |                                                    |
| ffmpeg-mac     |                                                    |
| ffmpeg-linux   |                                                    |
| ffmpeg-linux   |                                                    |
| ffmpeg-win     |                                                    |
| ffmpeg-win     |                                                    |
| x264           |                                                    |
| x265           |                                                    |
| one-encoder    |                                                    |
|                |                                                    |

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



----

以下是原项目的相关内容

## 使用

- 分支源码：https://github.com/hunshcn/project/archive/master.zip
- release源码：https://github.com/hunshcn/project/archive/v0.1.0.tar.gz
- release文件：https://github.com/hunshcn/project/releases/download/v0.1.0/example.zip
- 分支文件：https://github.com/hunshcn/project/blob/master/filename
- commit文件：https://github.com/hunshcn/project/blob/1111111111111111111111111111/filename
- gist：https://gist.githubusercontent.com/cielpy/351557e6e465c12986419ac5a4dd2568/raw/cmd.py

## cf worker版本部署

首页：https://workers.cloudflare.com

注册，登陆，`Start building`，取一个子域名，`Create a Worker`。

复制 [index.js](https://cdn.jsdelivr.net/hunshcn/gh-proxy@master/index.js)  到左侧代码框，`Save and deploy`。如果正常，右侧应显示首页。

`index.js`默认配置下clone走github.com.cnpmjs.org，项目文件会走jsDeliver，如需走worker，修改Config变量即可

`ASSET_URL`是静态资源的url（实际上就是现在显示出来的那个输入框单页面）

`PREFIX`是前缀，默认（根路径情况为"/"），如果自定义路由为example.com/gh/*，请将PREFIX改为 '/gh/'，注意，少一个杠都会错！

## Cloudflare Workers计费

到 `overview` 页面可参看使用情况。免费版每天有 10 万次免费请求，并且有每分钟1000次请求的限制。

如果不够用，可升级到 $5 的高级版本，每月可用 1000 万次请求（超出部分 $0.5/百万次请求）。

## 链接

## 参考

## 捐赠
