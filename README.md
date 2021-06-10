# better-github-api

基于gh-proxy和cloudflare workers提供github的更好的Serverless API服务，简单易用开销低，速度有保障（CDN）。

## 简介

cdn.js是原项目单纯的CDN加速功能

api.js是本项目的核心，提供API服务

## 当前进度

## 常用方法踩坑

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

## API设计

- KV（Key-Value）键值对：CloudFlare提供了免费1GB的键值对存储功能，可以设置多个命名空间，Workers可以读写这些键值对达到某种功能

### 一级API

| 键      | 含义                                                         |
| ------- | ------------------------------------------------------------ |
| /repo   | 获取GitHub仓库信息                                           |
| /get    | 利用KV中已有的键值对快速获取GitHub仓库信息                   |
| /bucket | 与get类似，但是获取的是KV中存储定时缓存的仓库信息，省去了访问GitHub API的过程 |
| /submit | 向KV提交键值对                                               |
| /list   | 列出KV键值对                                                 |

> bucket 想法是定时让CF去取地址放在键值对里，用bucket秒获得链接，不用解析github api，不知道有无弊端，最后实现。

### 二级API

### /repo

| API示例                                                  | 含义                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| /`仓库主`/`仓库名`/                                      | 同/`仓库主`/`仓库名`/latest，下面包含latest的API**同样适用**， |
| /`仓库主`/`仓库名`/`版本号`                              | 获取该仓库的`版本号`对应版本的唯一附件，附件>=1个时返回400错误 |
| /`仓库主`/`仓库名`/latest                                | 获取该仓库的最新版本的唯一附件，附件>=1个时返回400错误       |
| /`仓库主`/`仓库名`/latest/version                        | 获取该仓库的最新的版本号                                     |
| /`仓库主`/`仓库名`/latest/source                         | 获取该仓库的最新的源代码下载地址                             |
| /`仓库主`/`仓库名`/latest/info                           | 获取该仓库的最新的信息，包括版本号、更新内容、精简的附件信息和源代码下载地址 |
| /`仓库主`/`仓库名`/latest/&`包含`&`不包含`&`开头`&`结尾` | 获取该仓库的最新版本的附件，同时过滤附件名得到唯一附件，如&a&b&c&d代表附件名包含a、不包含d、开头为c结尾是d的附件，匹配的附件>=1个时返回400错误 |

- /info 返回JSON字符串结果，设计如下

| info    | 类型        | 含义      |
| ------- | ----------- | --------- |
| version | string      | 版本号    |
| source  | string      | 源代码URL |
| assets  | asset array | 附件      |
| log     | string      | 更新日志  |

| asset                | 类型   | 含义                                   |
| -------------------- | ------ | -------------------------------------- |
| name                 | string | 附件名                                 |
| size                 | int    | 附件大小                               |
| browser_download_url | string | 附件下载链接 （TODO 原始 or 加速后？） |

### /get

| API示例                                               | 含义                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| /get/`仓库简称`                                       | 获取该仓库的最新版本的唯一附件，使用KV存储的filter信息       |
| /get/`仓库简称`/`版本号`                              | 获取该仓库的`版本号`对应版本的附件，同样使用KV存储的filter信息 |
| /get/`仓库简称`/latest/version                        | 同repo处说明                                                 |
| /get/`仓库简称`/latest/source                         | 同repo处说明                                                 |
| /get/`仓库简称`/latest/info                           | 同repo处说明                                                 |
| /get/`仓库简称`/latest/&`包含`&`不包含`&`开头`&`结尾` | 同repo处说明，只是用这里给的filter                           |

至于KV里如何存`简称-全称`的对应关系

| 键     | 类型   | 例子                                                     |
| ------ | ------ | -------------------------------------------------------- |
| repo   | string | advancedfx/advancedfx                                    |
| filter | string | &hlae&&&.zip                                             |
| info   | object | {"zh_CN": "hlae的zip安装包", "zh_TW": "hlae的zip安裝器"} |

filter用`&`分隔的各个部分含义

| 键      | 含义       | 例   |
| ------- | ---------- | ---- |
| include | 包含字符串 | hlae |
| exclude | 排除字符串 |      |
| start   | 开头字符串 |      |
| end     | 结尾字符串 | .zip |

举例：键为 `hlae`，值为：

```
{
	"repo": "advancedfx/advancedfx",
	"filter": "&hlae&&&.zip",
	"info": {
		"zh_CN": "hlae的zip安装包",
		"zh_TW": "hlae的zip安裝包"
	}
}
```

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

之后使用URL如`https://api.upup.cool/get/hlae`即可直接下载hlae的最新zip安装包，同时包含CDN服务，避免了很多访问速度的问题。

### /bucket （未完成）

| API示例              | 含义               |
| -------------------- | ------------------ |
| /bucket              | 获取所有bucket信息 |
| /bucket/hlae         | 获取hlae最新安装包 |
| /bucket/hlae/version |                    |
| /bucket/ffmpeg/win/  |                    |
| /bucket/ffmpeg/win/  |                    |
| /get/hlae            |                    |

```
https://api.upup.cool/get/hlae
https://github.com/仓库名/archive/refs/tags/版本号.zip  //source下载
https://github.com/One-Studio/HLAE-Studio/archive/refs/heads/main.zip
```



### /submit（未完成）



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
