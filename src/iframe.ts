import { MxFun} from "mxdraw";
/* eslint-disable no-undef */
const MxIFrame = {
  init() {
	(MxFun as any).setPostMessageToParentFrameFunction(function(param: any) {
		(top as any ).postMessage(param, '*');
	});

	window.addEventListener('message', function(event) {
		if (event.data.type === "sendStringToExecute") {
		MxFun.sendStringToExecute(event.data.cmd, event.data);
		} else {
		console.log("mx:unprocessed message:");
		console.log(event.data);
		}

	}, false) ;
  },
};

export function init() {
  MxIFrame.init();
}


