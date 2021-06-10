<h1 align="center">better-github-api</h1>

<p align="center">Better, Eazy, Access Anywhere</p>

   [![stars](https://img.shields.io/github/stars/One-Studio/better-github-api.svg?style=flat&color=green)](https://github.com/One-Studio/better-github-api
)
   [![fork](https://img.shields.io/github/forks/One-Studio/better-github-api.svg?style=flat&color=critical)](https://github.com/One-Studio/better-github-api)
   ![license](https://img.shields.io/badge/license-MIT%203-orange.svg?style=flat)
   [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?style=flat)](https://github.com/One-Studio/better-github-api#捐赠
)
   [![translation](https://img.shields.io/badge/$-translation-ff69b4.svg?style=flat&color=blueviolet)](https://github.com/One-Studio/better-github-api#翻译)

## 介绍

基于 [gh-proxy](https://github.com/hunshcn/gh-proxy) + [Jsdelivr](https://www.jsdelivr.com/) + [cnpmjs](https://cnpmjs.org/) + [cloudflare workers](https://workers.cloudflare.com)  的 GitHub Serverless API 工具。

**cdn.js**：仅含 gh-proxy 中的CDN功能，URL后加上GitHub各种资源（源码、Release文件等）的下载链接跳转为对应CDN加速的链接。

**api.js**：本项目的核心，提供API服务，部署时只用修改最开始的几个变量参数。

### 问题

- GitHub资源下载龟速，你我都有办法，但是用户没有，而分发存储到其他地方也可能会增加开支和麻烦。
- GitHub的API没有办法直接获得 Release 的某个附件，如提供过滤选项在众多Assets中筛选想要的附件，**获取最新版本的某个附件**只能通过解析API进一步操作，而实际应提供一个固定、简短的API。
- Jsdelivr很好用，可结合GitHub Actions自动搬运资源，但是有~20MB/文件限制。

### 优势

- 使用 Jsdelivr 等CDN工具加速资源下载，Release文件加速无大小限制；
- 提供简明的API，可作为程序分发的固定下载链接；
- 开销低，每个账号CloudFlare Workers 免费请求额度为 **~1k次/小时** **~100k次/天**，5$付费版 **~10m次/天**，且可开多个账号。

> 如需用自己的域名，应使用CloudFlare的DNS服务（maybe可使用CNAME跳转Worker的域名）

## 路线图

- [x] repo
- [x] get
- [ ] bucket
- [ ] submit
- [ ] list
- [ ] ...

## 使用

如果有配置好的API服务可以直接使用，API[参考](##API设计)，这里给出可用的域名，请尽量自己搭建减少这里的压力，毕竟是免费的：

- https://api.upup.cool

> 也可以把你搭好的地址提交到issue中

## 部署

登录 [Cloudflare Workers](https://workers.cloudflare.com) 注册，登陆，选择Workers，创建Worker。

### CDN服务

1. 复制项目文件中`cdn.js`的内容到左侧代码框；
2. 修改 **ASSET_URL**, **Config**, **PREFIX**；
3. 保存并部署
4. （可选）修改Worker的域名/路由

### API服务

1. 复制项目文件中`api.js`的内容到左侧代码框，`保存并部署`。
2. 修改 **ASSET_URL**, **Config**, **PREFIX**
3. 保存并部署
4. 返回Workers界面，点击KV设置命名空间，添加两个命名空间：`KV`、`BUCKET`（可修改），回到Worker的设置页绑定命名空间，注意变量名称必须是`KV` 、`BUCKET`
5. （可选）修改Worker的域名/路由

#### 配置参数说明：

**ASSET_URL** 修改为Worker的域名，如用自定义域名也要改成对应的。

**Config** clone是否使用cnpm，项目文件是否使用jsDeliver的开关，1开，0关。

**PREFIX** 前缀，**一般不用改**，默认（根路径情况为"/"），如果自定义路由为example.com/gh/*，请将PREFIX改为 '/gh/'，注意，少一个杠都会错！

#### 域名修改说明：

如果有自己的域名，可以给CDN和API服务分配分配到两个子域名中。使用CloudFlare做域名的DNS服务器之后，按下表设置DNS：

| 类型 | 名称 | 内容    |
| ---- | ---- | ------- |
| A    | api  | 8.8.8.8 |
| A    | cdn  | 8.8.8.8 |

然后**域名设置页找到Workers**，添加路由，路由格式：

```
api.upup.cool/*
cdn.upup.cool/*
```

## API设计

KV（Key-Value）键值对：CloudFlare提供了免费1GB的键值对存储功能，可以设置多个命名空间，Workers可以读写这些键值对达到某种功能

### 一级API

| 参数    | 含义                                                    |
| ------- | ------------------------------------------------------- |
| /repo   | 获取GitHub仓库信息                                      |
| /get    | 利用KV中已有的键值对快速获取GitHub仓库信息              |
| /bucket | 与get类似，使用KV缓存的键值信息简化参数复杂度，加快响应 |
| /submit | 向KV提交键值对                                          |
| /list   | 列出KV键值对                                            |

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

### /submit（未完成）

