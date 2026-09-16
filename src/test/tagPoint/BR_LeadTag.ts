import { McGiWorldDraw, MrxDbgUiPrPoint, MxDbEntity, MxDbLeadTag, MxDrawObject, MxFun, MxThreeJS } from "mxdraw";
export default async function  BR_LeadTag() {
	const getPoint = new MrxDbgUiPrPoint();
	const pt = await getPoint.go();
	if (!pt) { return; }
	const tag = new MxDbLeadTag();
	tag.point = pt;
	tag.text = "测试Test";

	MxFun.addToCurrentSpace(tag);

}
