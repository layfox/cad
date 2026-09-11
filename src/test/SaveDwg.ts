///////////////////////////////////////////////////////////////////////////////
// 版权所有（C）2002-2022，成都梦想凯德科技有限公司。
// 本软件代码及其文档和相关资料归成都梦想凯德科技有限公司
// 应用包含本软件的程序必须包括以下声明
// 在版权声明中：
// 此应用程序与成都梦想凯德科技有限公司成协议。
// 通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import $api from '@/http';

import {
  McGiWorldDraw,
  MrxDbgUiPrPoint,
  MxDbEntity,
  MxDbImage,
  MxFun,
  MxThreeJS,

} from "mxdraw";

export function Mx_SaveDwg() {
  const mxobj = MxFun.getCurrentDraw();
  const saveData: any = mxobj.saveMxEntityToObject(true);
  saveData.savefile = "../../SRC/TsWeb/public/demo/hhhhnew.dwg";
  saveData.filename = "../../SRC/TsWeb/public/demo/hhhh.dwg";

  console.log(saveData);
  // 前端附带身份凭证的请求，服务器Access-Control-Allow-Origin 设为*不会生效.
  // 所以需要  $api.defaults.withCredentials = false
  $api.defaults.withCredentials = false;
	// $api.post("http://localhost:1337/savecomment", {
  $api.post(MxFun.getHostUrl() + ":1337/savecomment", {
	param: saveData,
  }).then((response: any) => {
	if (response.data.ret == 0) {
		// 后台程序TsWebNodejs\routes\savedwg.js，它会调用MxFileConvert.exe使用MxDrawNode\src\mxconvert\SaveCommentToDwg.ts把批注数据，保存到demo目录下的hhhhnew.dwg文件中.
		const sSaveUrl = MxFun.getHostUrl() + ":3000/demo/hhhhnew.dwg";
		// window.open(sSaveUrl);
		alert("保存成功，新文件下载地址:" + sSaveUrl);
	} else {
		alert("保存失败,错误码:" + response.data.ret);
		console.log(response.data);
	}
  })
  .catch((error: any) => {
	alert("保存失败");
  });
}
