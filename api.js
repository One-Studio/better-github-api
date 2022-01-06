"use strict";

/**
 * static files (404.html, sw.js, conf.js)
 */

//////////////////////////////////////////
//    以下是better-github-api的核心设置    //
//////////////////////////////////////////

//主页 请求无参数时跳转主页 要求有https://
const HOME_PAGE = "https://upup.cool";

//////////////////////////////////////////
//    以下是better-github-api的核心代码    //
//////////////////////////////////////////

// 获取handleRequest对请求处理的结果
addEventListener("fetch", (event) => {
  event.respondWith(
      handleRequest(event.request).catch(
          (err) => new Response(err.stack, { status: 500 })
      )
  );
});

/**
 * @param {Request} req
 * @param {string} path
 * @note 方法名修改为cdnHandler，参数增加req以返回请求，开头的几行删除
 */
async function cdnHandler(req, path) {
  path = path.replace("github.com", "github.com.cnpmjs.org");

  return Response.redirect(path, 302);
}

function getJsonLength(jsonData){
  var jsonLength = 0;
  for(var item in jsonData){
    jsonLength++;
  }
  return jsonLength;
}

/**
 * 列出当前的键值对信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function list(request, pathname) {
  return new Response("format is corrected, but this api is not implemented currently.", {status: 200})
}

/**
 * 获取Github Release API的结果
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {Promise<any>}
 */
async function getReleaseInfo(owner, repo, version) {
  //Github API请求URL
  let req = "https://api.github.com/repos/" + owner + "/" + repo + "/releases";

  //根据请求的版本完善URL
  if (version === "latest") {
    req += "/latest";
  } else {
    req += "/tags/" + version;
  }

  //获得release信息
  return await fetch(req, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36",
    },
  }).then(response => response.json()) // 解析结果为JSON;
}

/**
 * 获取GitHub Release的（最新）版本号
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {string}
 */
async function getVersion(owner, repo, version) {
  //先获取Release信息
  const resp = await getReleaseInfo(owner, repo, version);
  //tag_name即版本号
  return  resp.tag_name;
}

/**
 * 获取某个版本的源代码
 * @param request
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {Response}
 */
async function getSource(request, owner, repo, version) {
  //获取版本号
  const ver = await getVersion(owner, repo, version)
  // console.log(ver)
  return  cdnHandler(request, "https://github.com/" + owner + "/" + repo + "/archive/refs/tags/" + ver + ".zip")
}

/**
 * 获取附件
 * @param request
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @param {string} filter
 * @returns {Response} TODO 统一返回格式
 */
async function getAssets(request, owner, repo, version, filter) {
  //获取release信息
  const resp = await getReleaseInfo(owner, repo, version);
  console.log(resp)

  //附件为空
  if (getJsonLength(resp.assets) === 0) {
    return new Response("failed to find assets.", {status: 400})
  }

  //未设置filter过滤器，附件只有一个则返回结果
  if (!filter) {
    if (getJsonLength(resp.assets) === 1) {
      return cdnHandler(request, resp.assets[0].browser_download_url);
    } else {
      return new Response("failed to handle more than 1 asset without filter.", {status: 400})
    }
  }

  //有filter时，提取 include exclude start end 4个过滤器
  const flt = filter.split("&")

  //使用filter遍历所有附件
  let target, count = 0;
  for (const asset of resp.assets) {
    const name = asset.name

    if ( (flt[1] === '' || flt[1] === undefined || name.search(flt[1]) !== -1 ) &&
        (flt[2] === '' || flt[2] === undefined || name.search(flt[2]) === -1 ) &&
        (flt[3] === '' || flt[3] === undefined || name.startsWith(flt[3]) ) &&
        (flt[4] === '' || flt[4] === undefined || name.endsWith(flt[4]) ) ) {
      target = asset.browser_download_url;
      count++;
    }

    //超过一个匹配结果返回错误
    if ( count > 1 ) {
      return new Response("failed to handle multiple assets matched with filter: " + flt, {status: 400})
    }
  }

  //无匹配结果返回错误
  if (count <= 0) {
    return new Response("failed to find any matched assets with filter.", {status: 400})
  }

  //返回正确结果
  return cdnHandler(request, target);
}

/**
 * TODO 获取仓库的信息：版本号、更新内容、精简的附件信息和源代码下载地址
 * @param request
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {Response}
 */
async function getInfo(request, owner, repo, version) {
  //获取Release信息
  const resp = await getReleaseInfo(owner, repo, version);

  //判空
  if (resp.tag_name === '' || resp.tag_name === undefined) {
    return new Response("failed to get info, please check your url.", {status: 400})
  }

  //附件字段精简
  let assets = []
  for (const asset of resp.assets) {
    assets.push({
      name: asset.name,
      size: asset.size,
      browser_download_url: asset.browser_download_url,
    })
  }

  //信息聚合
  let info = {
    version : resp.tag_name,
    source : "https://github.com/" + owner + "/" + repo + "/archive/refs/tags/" + resp.tag_name + ".zip",
    assets : assets,
    log : resp.body
  }

  //返回Json格式的字符串
  return new Response(JSON.stringify(info))
}

/**
 * 访问GitHub仓库信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function repo(request, pathname) {
  //路径分隔 1=RepoOwner 2=RepoName 3...
  const strs = pathname.split("/");
  console.log(strs)

  //判空+赋值
  if (strs[1] === '' || strs[1] === undefined || strs[2] === '' || strs[2] === undefined) {
    return new Response('invalid input of Repo Owner or Repo Name.', {status: 400});
  }
  const owner = strs[1], repo = strs[2];

  //获取最新版的唯一附件
  if( (strs[3] === '' || strs[3] === undefined || strs[3] === 'latest') && (strs[4] === '' || strs[4] === undefined) ){
    return getAssets(request, owner, repo, "latest", "")
  }

  //获取过滤后的唯一附件
  if ( strs[3].startsWith("&") && (strs[4] === '' || strs[4] === undefined) ) {
    return getAssets(request, owner, repo, "latest", strs[3]);
  }

  //同上
  if ( (strs[3] === 'latest' && strs[4].startsWith("&")) ) {
    return getAssets(request, owner, repo, "latest", strs[4]);
  }

  //获取最新版本的版本号
  if ( (strs[3] === 'latest' && strs[4] === 'version') || (strs[3] === 'version') ) {
    const version = await getVersion(owner, repo, "latest")
    return new Response(version)
  }

  //获取最新版本的源码
  if ( (strs[3] === 'latest' && strs[4] === 'source') || (strs[3] === 'source') ) {
    return getSource(request, owner, repo, "latest")
  }

  //获取最新版本的信息
  if ( (strs[3] === 'latest' && strs[4] === 'info') || (strs[3] === 'info') ) {
    console.log('进入getInfo')
    return getInfo(request, owner, repo, "latest")
  }

  //指定标签的5种情况
  const tag_name = strs[3]

  //获取指定标签的唯一附件
  if (strs[4] === '' || strs[4] === undefined) {
    return getAssets(request, owner, repo, tag_name, "");
  }

  //同上且加入filter
  if (strs[4].startsWith("&")) {
    return getAssets(request, owner, repo,  tag_name, strs[4]);
  }

  //获取指定标签的源代码
  if (strs[4] === 'source') {
    return getSource(request, owner, repo, tag_name)
  }

  //获取指定标签的信息
  if (strs[4] === 'info') {
    return getInfo(request, owner, repo, tag_name)
  }

  //获取指定标签的版本 P.S. 这个请求无意义，返回错误
  if (strs[4] === 'version') {
    return new Response("meaningless request for a version's version.", {status: 400});
  }

  //没有匹配的情况，返回错误
  return new Response("invalid input.", {status: 400});
}

/**
 * 使用KV键值对的简写访问仓库信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function get(request, pathname) {
  //路径分隔 1=键 2...
  const strs = pathname.split("/")
  let key = strs[1];

  //处理空值
  if (key === '' || key === undefined) {
    return new Response("no key is found, check input.", {status: 400});
  }

  //转换成小写
  key = key.toLowerCase()

  //从KV命名空间获取数据
  const resp = await KV.get(key);
  if (resp == null) {
    return new Response('failed to find key:' + key, {status: 400});
  }
  const value = JSON.parse(resp);

  if (!value.hasOwnProperty("repo")) {
    return new Response('failed to get repo info from key-value pair\'s value' + key, {status: 400});
  }
  const info = value.info;
  const repo_info = value.repo;
  // const zh = info.zh_CN;

  //检查请求中有没有filter，有就替换KV里的
  let filter;
  if ( strs[strs.length-1].startsWith("&") ) {
    filter = strs[strs.length-1];
  } else {
    filter = value.filter;
  }

  //提取get/键/...后面的参数
  let param = strs.slice(2, strs.length).join("/")
  if (param) param = "/" + param

  //生成符合repo方法格式的请求参数
  const req = "/" + repo_info + param + "/" + filter;
  console.log(req)

  return repo(request, req);
}

/**
 * 获取已缓存的最新版本信息
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function bucket(request, pathname) {

  return  fetch("");
}

/**
 * 提交get的快速键值对，需要Auth认证
 * @param {Request} request
 * @param pathname
 * @returns {Promise<Response>}
 */
async function submit(request, pathname) {

  return  fetch("");
}

/**
 * 请求处理的主体
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  //空请求返回主页
  if (pathname === '' || pathname === '/') {
    return Response.redirect(HOME_PAGE, 302);
  }

  //列出当前的键值对信息
  if (pathname.startsWith("/list")) {
    return list(request, pathname)
  }

  //访问GitHub仓库信息
  if (pathname.startsWith("/repo")) {
    return repo(request, pathname.replace("/repo", ""))
  }

  //使用KV键值对的简写访问仓库信息
  if (pathname.startsWith("/get")) {
    return get(request, pathname.replace("/get", ""))
  }

  //获取已缓存的最新版本信息
  if (pathname.startsWith("/bucket")) {
    return bucket(request, pathname.replace("/bucket", ""))
  }

  //提交get的快速键值对，需要Auth认证
  if (pathname.startsWith("/submit")) {
    return submit(request, pathname.replace("/submit", ""))
  }

  return new Response("invalid request format.", {status: 404});
}
