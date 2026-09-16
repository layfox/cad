<template>
  <div class="iv-cad-viewer">
    <!-- 顶部导航栏 -->
    <div class="header-bar">
      <div class="header-left">
        <span class="title">CAD 查看器</span>
        <!-- <Tag color="green" size="small">mxdraw - 梦想凯德 CAD</Tag> -->
      </div>
      <div class="header-right">
        <Button 
          :type="theme === 'light' ? 'default' : 'primary'" 
          size="small" 
          :icon="theme === 'light' ? 'md-moon' : 'md-sunny'"
          @click="toggleTheme"
        >
          {{ theme === 'light' ? '深色' : '浅色' }}
        </Button>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div class="left-panel" :class="{ collapsed: panelCollapsed }">
        <!-- 收缩/展开按钮 -->
        <div class="panel-toggle-btn" @click="togglePanel">
          <Icon :type="panelCollapsed ? 'md-arrow-forward' : 'md-arrow-back'" />
        </div>

        <!-- 面板内容（收缩时隐藏） -->
        <div v-show="!panelCollapsed" class="panel-content">
        <!-- 文件加载 -->
        <!-- <Card title="文件加载" icon="md-folder-open" :bordered="false">
          <div class="panel-section">
            <Input v-model="fileUrlInput" placeholder="输入 .mxweb 文件 URL" />
            <Button type="primary" icon="md-play" long style="margin-top: 8px" @click="loadFromUrl">
              从 URL 加载
            </Button>
          </div>
          <Divider style="margin: 12px 0" />
          <div class="panel-section">
            <Alert type="warning" show-icon :closable="false">
              DWG 文件需先转换为 .mxweb 格式
            </Alert>
          </div>
        </Card> -->

        <!-- 视图控制 -->
        <Card title="视图控制" icon="md-zoom" :bordered="false">
          <!-- <Row :gutter="8">
            <Col span="12">
              <Button icon="md-expand" long @click="zoomAll">适应窗口</Button>
            </Col>
            <Col span="12">
              <Button icon="md-add" long @click="zoomIn">放大</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button icon="md-remove" long @click="zoomOut">缩小</Button>
            </Col>
            <Col span="12">
              <Button icon="md-refresh" long @click="resetView">重置视图</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button icon="md-square-outline" long @click="zoomWindow">窗口缩放</Button>
            </Col>
            <Col span="12">
              <Button icon="md-redo" long @click="regen">重绘</Button>
            </Col>
          </Row> -->
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button type="primary" icon="md-bookmark" long @click="saveCurrentView">保存视图</Button>
            </Col>
            <Col span="12">
              <Button type="default" icon="md-close" long @click="stopCommand">退出命令</Button>
            </Col>
          </Row>
        </Card>

        <!-- 测量工具 -->
        <Card title="测量工具" icon="md-ruler" :bordered="false">
          <Row :gutter="8">
            <Col span="12">
              <Button type="success" icon="md-code-working" long @click="startMeasureDistance">距离测量</Button>
            </Col>
            <Col span="12">
              <Button type="success" icon="md-navigate" long @click="startMeasureCoord">坐标测量</Button>
            </Col>
          </Row>
          <Row :gutter="8" style="margin-top: 8px">
            <Col span="12">
              <Button type="success" icon="md-square-outline" long @click="startMeasureArea">面积测量</Button>
            </Col>
            <Col span="12">
              <Button type="success" icon="md-compass" long @click="startMeasureAngle">角度测量</Button>
            </Col>
          </Row>
        </Card>

        <!-- 标注工具 -->
        <Card title="标注工具" icon="md-pin" :bordered="false">
          <Row :gutter="8">
            <Col span="24">
              <Button type="warning" icon="md-add-circle" long @click="startAddAnnotation">
                添加标注点
              </Button>
            </Col>
          </Row>
          <div v-if="annotationPoints.length > 0" style="margin-top: 8px; font-size: 12px; color: #909399;">
            已添加 {{ annotationPoints.length }} 个标注点，点击标注点可查看详情
          </div>
        </Card>



        <!-- 图层/点位 Tab切换 -->
        <Card :bordered="false" class="info-tab-card">
          <Tabs v-model="activeTab" size="small">
            <!-- 图层信息 Tab -->
            <TabPane label="图层信息" name="layer">
              <div class="layer-count">
                <span class="count">{{ layerCount }}</span>
                <span class="label">个图层</span>
              </div>
              <div v-if="layers.length > 0" class="layer-list-panel">
                <div class="layer-list-header">
                  <span>点击图层可切换显示/隐藏</span>
                </div>
                <div class="layer-list-scroll">
                  <div
                    v-for="(layer, index) in layers"
                    :key="layer.name + '_' + index"
                    class="layer-item-row"
                    :class="{ 'layer-off': layer.off }"
                    @click="toggleLayer(layer, layer.off)"
                  >
                    <span
                      class="layer-color-dot"
                      :style="{ backgroundColor: getLayerColor(layer.colorValue) }"
                    ></span>
                    <span class="layer-name-text">{{ layer.name }}</span>
                    <Icon :type="layer.off ? 'md-eye-off' : 'md-eye'" class="layer-eye-icon" />
                  </div>
                </div>
              </div>
              <div v-else class="layer-empty">
                暂无图层数据
              </div>
            </TabPane>

            <!-- 点位信息 Tab -->
            <TabPane label="点位信息" name="point">
              <div class="layer-count">
                <span class="count">{{ pointCount }}</span>
                <span class="label">个点位</span>
              </div>
              <div v-if="points.length > 0" class="layer-list-panel">
                <div class="layer-list-header">
                  <span>点击名称定位，点击眼睛切换显示</span>
                </div>
                <div class="layer-list-scroll">
                  <div
                    v-for="(point, index) in points"
                    :key="'point_' + index"
                    class="layer-item-row point-item-row"
                    :class="{ 'layer-off': !point.visible }"
                  >
                    <span class="layer-color-dot" style="background-color: #1890ff"></span>
                    <span class="layer-name-text point-info-text" @click="locatePoint(point)">
                      <span class="point-name">{{ point.name || ('点位' + point.index) }}</span>
                      <span class="point-coord">X: {{ point.x.toFixed(2) }}, Y: {{ point.y.toFixed(2) }}</span>
                      <span class="point-desc">{{ point.description || point.layer }}</span>
                    </span>
                    <Icon 
                      :type="point.visible ? 'md-eye' : 'md-eye-off'" 
                      class="layer-eye-icon"
                      @click.stop="togglePoint(point)"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="layer-empty">
                暂无点位数据
              </div>
            </TabPane>
          </Tabs>
        </Card>
        </div>
      </div>

      <!-- 右侧 Viewer -->
      <div class="right-panel" :class="{ 'dark-theme': theme === 'dark' }">
        <div ref="viewerContainer" class="viewer-container" :class="{ 'color-invert': theme === 'light' }">
          <canvas ref="mxcadCanvas" id="mxcad"></canvas>
        </div>

        <!-- 加载遮罩 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ loadingText }}</div>
            <div class="loading-step">{{ loadingStep }}</div>
            <div class="loading-progress">
              <div class="progress-bar" :style="{ width: loadingProgress + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 当前命令提示 -->
        <div v-if="currentCommand" class="command-tip">
          <Tag color="blue" :closable="true" @click="stopCommand">
            <Icon type="md-build" /> 当前：{{ currentCommand }}
          </Tag>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span class="status-item">
          <Icon type="md-document" />
          {{ fileName || '图纸未加载' }}
        </span>
      </div>
      <div class="status-right">
        <span class="status-item">
          <span class="status-dot" :class="{ ready: viewerReady }"></span>
          {{ viewerReady ? '就绪' : '初始化中' }}
        </span>
      </div>
    </div>

    <!-- 图层弹窗 -->
    <Modal
      v-model="showLayers"
      title="图层管理"
      width="500px"
      :footer-hide="true"
    >
      <div class="layer-list">
        <div
          v-for="(layer, index) in layers"
          :key="layer.name + '_' + index"
          class="layer-item"
        >
          <Checkbox
            :checked="!layer.off"
            @on-change="toggleLayer(layer, $event)"
          >
            <span
              class="layer-color"
              :style="{ backgroundColor: getLayerColor(layer.colorValue) }"
            ></span>
            {{ layer.name }}
          </Checkbox>
        </div>
        <div v-if="layers.length === 0" class="empty-tip">暂无图层数据</div>
      </div>
    </Modal>

    

    <!-- 编辑文字弹窗 -->
    <Modal
      v-model="showEditTextModal"
      title="编辑文字"
      width="400px"
      @on-ok="confirmEditText"
      @on-cancel="cancelEditText"
    >
      <div class="edit-text-form">
        <div class="form-item">
          <label>实体类型：</label>
          <span>{{ editTextType }}</span>
        </div>
        <div class="form-item">
          <label>文字内容：</label>
          <Input
            v-model="editTextValue"
            type="textarea"
            :rows="3"
            placeholder="请输入文字内容"
          />
        </div>
      </div>
    </Modal>

    <!-- 标注点信息弹窗 -->
    <Modal
      v-model="showAnnotationModal"
      :title="selectedAnnotation && selectedAnnotation.isNew ? '添加标注点' : '标注点信息'"
      width="450px"
      @on-cancel="closeAnnotationModal"
    >
      <div class="annotation-form">
        <div class="form-item">
          <label>标注名称：</label>
          <Input
            v-model="annotationForm.name"
            placeholder="请输入标注点名称"
          />
        </div>
        <div class="form-item">
          <label>标注描述：</label>
          <Input
            v-model="annotationForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标注点描述信息"
          />
        </div>
        <div class="form-item" v-if="selectedAnnotation">
          <label>坐标位置：</label>
          <span class="coord-text">
            X: {{ selectedAnnotation.x ? selectedAnnotation.x.toFixed(2) : '0.00' }}, 
            Y: {{ selectedAnnotation.y ? selectedAnnotation.y.toFixed(2) : '0.00' }}
          </span>
        </div>
        <div class="form-item" v-if="selectedAnnotation && !selectedAnnotation.isNew">
          <label>创建时间：</label>
          <span>{{ selectedAnnotation.createTime }}</span>
        </div>
      </div>
      <div slot="footer">
        <Button v-if="selectedAnnotation && !selectedAnnotation.isNew" type="error" @click="deleteAnnotation">删除</Button>
        <Button type="primary" @click="confirmAddAnnotation">
          {{ selectedAnnotation && selectedAnnotation.isNew ? '确认添加' : '关闭' }}
        </Button>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { createMxCad, MxCpp, McCmColor } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject, MxDbLine, MxDbCircleShape, MxDbAnyLine } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import { MyRect } from "@/test/DrawRect";
import * as THREE from "three";

@Component
export default class IvCadViewer extends Vue {
  // 文件 URL
  public fileUrlInput = "./models/YTSF-001.mxweb";
  public fileName = "";

  // 加载状态
  public loading = true;
  public loadingText = "正在初始化查看器...";
  public loadingStep = "准备中";
  public loadingProgress = 0;

  // Viewer 状态
  public viewerReady = false;
  public mxcad: any = null;
  public mxDraw: any = null;

  // 图层数据
  public layerCount = 0;
  public layers: any[] = [];
  public showLayers = false;

  // 点位数据
  public pointCount = 0;
  public points: any[] = [];

  // Tab切换
  public activeTab = "layer";

  // 主题（light/dark）
  public theme = "light";

  // 文字增强（白色文字改为黑色，增强浅色背景下的可读性）
  public textEnhanced = false;

  // 保存原始文字颜色，用于恢复
  public originalTextColors: Map<any, any> = new Map();

  // 帮助弹窗
  public showHelp = false;

  // 编辑文字弹窗
  public showEditTextModal = false;
  public editTextValue = "";
  public editTextType = "";
  public editTextEntity: any = null;

  // 标注点功能
  public annotationPoints: any[] = [];
  public showAnnotationModal = false;
  public selectedAnnotation: any = null;
  public annotationForm = {
	name: "",
	description: "",
  };
  public isAddingAnnotation = false;

  // 当前命令
  public currentCommand = "";

  // 测量结果
  public measureResult = "";

  // 面板收缩状态
  public panelCollapsed = false;

  // Ctrl + 左键平移状态
  public isCtrlPanning = false;
  public lastMouseX = 0;
  public lastMouseY = 0;

  public mounted() {
	// 从 localStorage 读取主题偏好
	const savedTheme = localStorage.getItem("cad_viewer_theme");
	if (savedTheme === "dark" || savedTheme === "light") {
		this.theme = savedTheme;
	}

	// 从 localStorage 读取文字增强偏好
	const savedTextEnhanced = localStorage.getItem("cad_viewer_text_enhanced");
	if (savedTextEnhanced === "true") {
		this.textEnhanced = true;
	}

	this.initViewer();
	// 监听 ESC 键取消命令
	document.addEventListener("keydown", this.handleKeydown);
	// 监听 Ctrl + 左键平移
	this.$nextTick(() => {
		this.initCtrlPan();
	});
	// 延迟添加标注点点击事件监听（等canvas创建完成）
	setTimeout(() => {
		this.initAnnotationClick();
	}, 1000);
  }

  public beforeDestroy() {
	this.destroyViewer();
	document.removeEventListener("keydown", this.handleKeydown);

	// 移除 Ctrl + 左键平移事件监听
	const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
	if (canvas) {
		canvas.removeEventListener("mousedown", this.handleCtrlPanMouseDown);
		canvas.removeEventListener("mousemove", this.handleCtrlPanMouseMove);
		canvas.removeEventListener("mouseup", this.handleCtrlPanMouseUp);
		canvas.removeEventListener("mouseleave", this.handleCtrlPanMouseUp);
		// 移除标注点点击事件监听
		canvas.removeEventListener("mousedown", this.handleAnnotationClick, true);
		// 移除标注点悬停事件监听
		canvas.removeEventListener("mousemove", this.handleAnnotationHover);
		// 恢复鼠标样式
		canvas.style.cursor = "";
	}
  }

  /**
   * 键盘事件处理
   */
  public handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		this.stopCommand();
	}
  }

  /**
   * 初始化 Viewer
   */
  public async initViewer() {
	try {
		this.loading = true;
		this.loadingText = "正在初始化查看器...";
		this.loadingStep = "加载核心模块";
		this.loadingProgress = 10;

		// 注册所有命令和自定义实体
		console.log("注册命令和自定义实体...");
		RegistMxCommands();
		RxInitMxEntity();

		const useST = !("SharedArrayBuffer" in window);
		const wasmPath = useST ? "./wasm/2d-st/" : "./wasm/2d/";

		console.log("WASM 路径:", wasmPath);

		this.loadingStep = "初始化 WASM 模块";
		this.loadingProgress = 30;

		const mxcad = await createMxCad({
		canvas: "#mxcad",
		locateFile: (fileName: string) => {
			return new URL(wasmPath + fileName, window.location.origin + window.location.pathname).href;
		},
		// fileUrl: "./models/HDMY-XJH.mxweb",
		// fileUrl:"./models/HDMY-XJH-v2.mxweb",
		fileUrl: "./models/YTSF-001.mxweb",
		browse: true,
		multipleSelect: false,
		middlePan: 1,
		// 浅色主题用黑色背景（配合CSS反转后变成白色背景，白色文字变黑）
		// 深色主题用黑色背景（正常显示）
		viewBackgroundColor: { red: 0, green: 0, blue: 0 },
		authorized_service: "same_current_page_url",
		onInit: () => {
			console.log("MxCAD 初始化回调，加载字体...");
			try {
			// 禁用对象智能选择功能，避免点击标注点时进入编辑状态
			MxFun.setIniset({
				EnableIntelliSelect: false,
				multipleSelect: false,
			});
			console.log("已禁用对象智能选择功能");
			} catch (e) {
			console.warn("禁用对象选择失败:", e);
			}

			try {
			MxCpp.App.addNetworkLoadingFont([
				"txt.shx",
				"simplex.shx",
				"gdt.shx",
				"aaa.shx",
				"ltypeshp.shx",
				"complex.shx",
				"isocp.shx",
				"isoct.shx",
				"romans.shx",
			]);
			MxCpp.App.addNetworkLoadingBigFont([
				"hztxt.shx",
				"gbcbig.shx",
				"tssdchn.shx",
				"gbhzfs.shx",
			]);
			} catch (e) {
			console.warn("字体加载警告:", e);
			}
		},
		});

		console.log("MxCAD 实例创建成功:", mxcad);

		this.mxcad = mxcad;
		this.mxDraw = mxcad.mxdraw;
		this.fileUrl = "./models/YTSF-001.mxweb"; // 记录当前文件URL

		// 启用鼠标中键平移（我们会把 Ctrl + 左键模拟成中键事件）
		try {
		mxcad.mxdraw.setMouseMiddlePan(true);
		console.log("已启用中键平移，Ctrl + 左键会模拟成中键事件");
		} catch (e) {
		console.warn("设置中键平移失败:", e);
		}

		// 设置滚轮缩放速度（数值越小缩放越慢）
		try {
		mxcad.mxdraw.setZoomSpeed(1.8);
		console.log("已设置滚轮缩放速度为 1.8");
		} catch (e) {
		console.warn("设置缩放速度失败:", e);
		}

		// 二次注册命令（mxcad 实例创建后可能会重置 MxFun 状态）
		console.log("二次注册命令...");
		RegistMxCommands();
		RxInitMxEntity();

		this.loadingStep = "初始化完成";
		this.loadingProgress = 90;

		// 监听文件加载完成
		mxcad.mxdraw.on("openFileComplete", () => {
		console.log("文件加载完成");
		this.onFileLoaded();
		});

		// 监听图层数据更新
		mxcad.mxdraw.on("uiSetLayerData", (listLayer: any[]) => {
		console.log("图层数据更新:", listLayer);
		this.layers = listLayer.map((v) => ({
			name: v.name,
			id: v.id,
			off: v.off,
			colorValue: v.colorValue,
		}));
		this.layerCount = this.layers.length;
		});

		// 监听命令行输入
		MxFun.listenForCommandLineInput(({ msCmdTip, msCmdDisplay, msCmdText }: any) => {
		console.log("命令行:", msCmdTip, msCmdDisplay, msCmdText);
		// 如果有测量结果，更新显示
		if (msCmdDisplay && msCmdDisplay.length > 0) {
			this.measureResult = msCmdDisplay;
		}
		});

		this.viewerReady = true;
		// this.loading = false; // 移到 onFileLoaded 中，避免闪烁
		this.loadingProgress = 100;
		this.fileName = "HDMY-XJH.mxweb";

		// this.$Message.success("MxCAD 查看器初始化成功");

	} catch (error) {
		console.error("MxCAD 初始化失败:", error);
		this.loading = false;
		this.$Message.error("MxCAD 查看器初始化失败: " + (error as Error).message);
	}
  }

  /**
   * 文件加载完成回调
   */
  public onFileLoaded() {
	console.log("文件加载完成");

	// 从 fileUrl 中提取文件名
	const fileName = this.fileUrl ? this.fileUrl.split('/').pop() : "default";
	console.log("当前文件名:", fileName);

	// 检查 localStorage 中有没有保存的视图参数
	const savedView = localStorage.getItem("cad_view_" + fileName);

	if (savedView) {
		// 有保存的视图参数，应用保存的视图
		console.log("找到保存的视图参数，应用中...");
		try {
		const viewParams = JSON.parse(savedView);
		console.log("视图参数:", viewParams);

		if (this.mxcad && this.mxcad.zoomCenter && this.mxcad.zoomScale && this.mxcad.getViewCADCoord) {
			// 先获取当前视图宽度
			const currentView = this.mxcad.getViewCADCoord();
			if (currentView && currentView.pt1 && currentView.pt2) {
			const curMinX = Math.min(currentView.pt1.x, currentView.pt2.x, currentView.pt3.x, currentView.pt4.x);
			const curMaxX = Math.max(currentView.pt1.x, currentView.pt2.x, currentView.pt3.x, currentView.pt4.x);
			const curWidth = curMaxX - curMinX;
			const targetWidth = viewParams.width;
			const scale = curWidth / targetWidth;

			console.log("当前宽度:", curWidth, "目标宽度:", targetWidth, "缩放比例:", scale);

			// 先设置中心点
			this.mxcad.zoomCenter(viewParams.centerX, viewParams.centerY);

			// 再缩放
			this.mxcad.zoomScale(scale);

			console.log("已应用保存的视图参数（zoomCenter + zoomScale 方式）");

			// 延迟隐藏加载遮罩
			setTimeout(() => {
				this.loading = false;
			}, 300);
			} else {
			console.warn("无法获取当前视图宽度，直接显示初始视图");
			this.loading = false;
			}
		} else {
			console.warn("zoomCenter 或 zoomScale 不存在，直接显示初始视图");
			this.loading = false;
		}
		} catch (e) {
		console.error("应用保存的视图参数失败:", e);
		this.loading = false;
		}
	} else {
		// 没有保存的视图参数，直接显示初始视图
		console.log("没有保存的视图参数，显示初始视图");
		console.log("提示：您可以手动调整视图后，点击\"保存当前视图\"按钮，下次打开自动恢复");
		this.loading = false;
	}

	// 获取当前视图范围
	try {
		if (this.mxcad && this.mxcad.getViewCADCoord) {
		const view = this.mxcad.getViewCADCoord();
		console.log("当前视图范围:", view);
		if (view && view.pt1 && view.pt2) {
			const minX = Math.min(view.pt1.x, view.pt2.x, view.pt3.x, view.pt4.x);
			const maxX = Math.max(view.pt1.x, view.pt2.x, view.pt3.x, view.pt4.x);
			const minY = Math.min(view.pt1.y, view.pt2.y, view.pt3.y, view.pt4.y);
			const maxY = Math.max(view.pt1.y, view.pt2.y, view.pt3.y, view.pt4.y);
			console.log("当前视图范围（计算后）:", {
			minX, minY, maxX, maxY,
			width: maxX - minX,
			height: maxY - minY,
			});
		}
		}
	} catch (e) {
		console.warn("获取视图范围失败:", e);
	}

	// 主动获取图层数据（防止 uiSetLayerData 事件未触发）
	try {
		if (this.mxcad && this.mxcad.getDatabase) {
		const layerTable = this.mxcad.getDatabase().getLayerTable();
		const aryId = layerTable.getAllRecordId();
		console.log("主动获取图层数量:", aryId.length);

		if (aryId.length > 0 && this.layers.length === 0) {
			this.layers = aryId.map((id: any) => {
			const record = id.getMcDbLayerTableRecord();
			if (record) {
				let colorValue = 0;
				try {
				if (record.color && record.color.getColorValue) {
					colorValue = record.color.getColorValue();
				}
				} catch (e) {}

				return {
				name: record.name,
				id,
				off: record.isOff,
				colorValue,
				};
			}
			return {
				name: "未知图层",
				id,
				off: false,
				colorValue: 0,
			};
			});
			this.layerCount = this.layers.length;
			console.log("主动获取图层数据成功，图层数量:", this.layerCount);
			console.log("图层列表:", this.layers.map((l: any) => l.name));
		}
		}
	} catch (e) {
		console.warn("主动获取图层数据失败:", e);
	}

	// 获取点位数据
	try {
		if (this.mxcad && this.mxcad.getDatabase) {
		const blockTable = this.mxcad.getDatabase().getBlockTable();
		const blockRecordIds = blockTable.getAllRecordId();
		console.log("块表记录数量:", blockRecordIds.length);

		let modelSpace: any = null;

		// 查找模型空间
		for (let i = 0; i < blockRecordIds.length; i++) {
			const blkRecId = blockRecordIds[i];
			try {
			const blkRec = blkRecId.getMcDbBlockTableRecord();
			if (blkRec) {
				const name = blkRec.name || blkRec.getName?.() || "";
				if (name === "*Model_Space" || name === "Model_Space" || name.includes("Model")) {
				modelSpace = blkRec;
				console.log("找到模型空间:", name);
				break;
				}
			}
			} catch (e) {}
		}

		if (modelSpace) {
			const entityIds = modelSpace.getAllEntityId();
			console.log("模型空间实体数量:", entityIds.length);

			const pointList: any[] = [];
			let pointIndex = 0;
			let blockIndex = 0;

			for (let i = 0; i < entityIds.length; i++) {
			const entId = entityIds[i];
			try {
				// 1. 处理点实体（McDbPoint）
				if (entId.isKindOf("McDbPoint")) {
				const pointEnt = entId.getMcDbEntity() as any;
				if (pointEnt && pointEnt.position) {
					const pos = pointEnt.position;
					// 获取图层名称
					let layerName = "未知图层";
					try {
					const layerId = pointEnt.layerId;
					if (layerId) {
						const layerRec = layerId.getMcDbLayerTableRecord();
						if (layerRec) {
						layerName = layerRec.name;
						}
					}
					} catch (e) {}

					pointIndex++;
					pointList.push({
					id: entId,
					type: "point",
					name: `点${pointIndex}`,
					x: pos.x,
					y: pos.y,
					z: pos.z,
					layer: layerName,
					description: `图层: ${layerName}`,
					visible: true,
					index: pointList.length + 1,
					});
				}
				}

				// 2. 处理块引用（McDbBlockReference）- 从属性中获取名称和描述
				if (entId.isKindOf("McDbBlockReference")) {
				const blkRef = entId.getMcDbEntity() as any;
				if (blkRef && blkRef.position) {
					const pos = blkRef.position;
					const blockName = blkRef.blockName || "未知块";

					// 获取图层名称
					let layerName = "未知图层";
					try {
					const layerId = blkRef.layerId;
					if (layerId) {
						const layerRec = layerId.getMcDbLayerTableRecord();
						if (layerRec) {
						layerName = layerRec.name;
						}
					}
					} catch (e) {}

					// 获取块引用的所有属性
					const attributes: any[] = [];
					let pointName = "";
					let pointDesc = "";

					try {
					if (blkRef.getAllAttribute) {
						const attrIds = blkRef.getAllAttribute();
						if (attrIds && attrIds.length > 0) {
						for (let j = 0; j < attrIds.length; j++) {
							try {
							const attr = attrIds[j].getMcDbEntity() as any;
							if (attr) {
								const tag = attr.tag || "";
								const value = attr.textString || "";
								attributes.push({ tag, value });

								// 尝试找名称属性
								if (!pointName && (tag.includes("名称") || tag.includes("编号") ||
									tag.toLowerCase().includes("name") || tag.toLowerCase().includes("code") ||
									tag.toLowerCase().includes("id") || tag.includes("号"))) {
								pointName = value;
								}
							}
							} catch (e) {}
						}
						}
					}
					} catch (e) {}

					// 构建描述信息
					if (attributes.length > 0) {
					pointDesc = attributes.map((a: any) => `${a.tag}: ${a.value}`).join(", ");
					} else {
					pointDesc = `块: ${blockName}, 图层: ${layerName}`;
					}

					// 如果没有找到名称属性，用块名称
					if (!pointName) {
					blockIndex++;
					pointName = `${blockName}${blockIndex}`;
					}

					pointList.push({
					id: entId,
					type: "block",
					blockName,
					name: pointName,
					x: pos.x,
					y: pos.y,
					z: pos.z,
					layer: layerName,
					description: pointDesc,
					attributes,
					visible: true,
					index: pointList.length + 1,
					});
				}
				}
			} catch (e) {}
			}

			this.points = pointList;
			this.pointCount = pointList.length;
			console.log("获取点位数据成功，点位总数:", this.pointCount);
			console.log("其中点实体:", pointIndex, "个，块引用:", blockIndex, "个");
			if (this.pointCount > 0) {
			console.log("前10个点位:", this.points.slice(0, 10));
			}
		} else {
			console.warn("未找到模型空间");
		}
		}
	} catch (e) {
		console.warn("获取点位数据失败:", e);
	}

	// 如果开启了文字增强，自动应用
	if (this.textEnhanced) {
		console.log("文字增强已开启，自动应用...");
		setTimeout(() => {
		this.enhanceTextColor();
		}, 500);
	}
  }

  /**
   * 从 URL 加载
   */
  public loadFromUrl() {
	if (!this.fileUrlInput) {
		this.$Message.warning("请输入文件 URL");
		return;
	}
	// 重新加载
	this.destroyViewer();
	this.$nextTick(() => {
		this.initViewerWithFile(this.fileUrlInput);
	});
  }

  /**
   * 带文件初始化
   */
  public async initViewerWithFile(fileUrl: string) {
	try {
		this.loading = true;
		this.loadingText = "正在加载图纸...";
		this.loadingStep = "创建渲染实例";
		this.loadingProgress = 50;

		const useST = !("SharedArrayBuffer" in window);
		const wasmPath = useST ? "./wasm/2d-st/" : "./wasm/2d/";

		const mxcad = await createMxCad({
		canvas: "#mxcad",
		locateFile: (fileName: string) => {
			return new URL(wasmPath + fileName, window.location.origin + window.location.pathname).href;
		},
		fileUrl,
		browse: true,
		multipleSelect: false,
		middlePan: 1,
		// 浅色主题用黑色背景（配合CSS反转后变成白色背景，白色文字变黑）
		// 深色主题用黑色背景（正常显示）
		viewBackgroundColor: { red: 0, green: 0, blue: 0 },
		authorized_service: "same_current_page_url",
		onInit: () => {
			try {
			// 禁用对象智能选择功能，避免点击标注点时进入编辑状态
			MxFun.setIniset({
				EnableIntelliSelect: false,
				multipleSelect: false,
			});
			console.log("已禁用对象智能选择功能");
			} catch (e) {
			console.warn("禁用对象选择失败:", e);
			}

			try {
			MxCpp.App.addNetworkLoadingFont([
				"txt.shx", "simplex.shx", "gdt.shx", "aaa.shx",
				"ltypeshp.shx", "complex.shx", "isocp.shx", "isoct.shx", "romans.shx",
			]);
			MxCpp.App.addNetworkLoadingBigFont([
				"hztxt.shx", "gbcbig.shx", "tssdchn.shx", "gbhzfs.shx",
			]);
			} catch (e) {
			console.warn("字体加载警告:", e);
			}
		},
		});

		this.mxcad = mxcad;
		this.mxDraw = mxcad.mxdraw;
		this.fileUrl = fileUrl; // 记录当前文件URL
		this.fileName = fileUrl.split("/").pop() || "unknown";

		// 启用鼠标中键平移（我们会把 Ctrl + 左键模拟成中键事件）
		try {
		mxcad.mxdraw.setMouseMiddlePan(true);
		console.log("已启用中键平移，Ctrl + 左键会模拟成中键事件");
		} catch (e) {
		console.warn("设置中键平移失败:", e);
		}

		// 设置滚轮缩放速度（数值越小缩放越慢）
		try {
		mxcad.mxdraw.setZoomSpeed(1.8);
		console.log("已设置滚轮缩放速度为 1.8");
		} catch (e) {
		console.warn("设置缩放速度失败:", e);
		}

		// 二次注册命令
		RegistMxCommands();
		RxInitMxEntity();

		mxcad.mxdraw.on("openFileComplete", () => {
		this.onFileLoaded();
		});

		mxcad.mxdraw.on("uiSetLayerData", (listLayer: any[]) => {
		console.log("-------listLayer--------", listLayer);
		this.layers = listLayer.map((v) => ({
			name: v.name,
			id: v.id,
			off: v.off,
			colorValue: v.colorValue,
		}));
		this.layerCount = this.layers.length;
		});

		this.viewerReady = true;
		this.loading = false;
		this.loadingProgress = 100;

	} catch (error) {
		console.error("文件加载失败:", error);
		this.loading = false;
		this.$Message.error("文件加载失败: " + (error as Error).message);
	}
  }

  // ============== 视图控制 ==============

  /**
   * 保存当前视图参数
   */
  public saveCurrentView() {
	try {
		if (!this.mxcad || !this.mxcad.getViewCADCoord) {
		this.$Message.warning("无法获取视图信息");
		return;
		}

		const view = this.mxcad.getViewCADCoord();
		console.log("当前视图范围:", view);

		if (view && view.pt1 && view.pt2) {
		const minX = Math.min(view.pt1.x, view.pt2.x, view.pt3.x, view.pt4.x);
		const maxX = Math.max(view.pt1.x, view.pt2.x, view.pt3.x, view.pt4.x);
		const minY = Math.min(view.pt1.y, view.pt2.y, view.pt3.y, view.pt4.y);
		const maxY = Math.max(view.pt1.y, view.pt2.y, view.pt3.y, view.pt4.y);

		const viewParams = {
			minX,
			minY,
			maxX,
			maxY,
			width: maxX - minX,
			height: maxY - minY,
			centerX: (minX + maxX) / 2,
			centerY: (minY + maxY) / 2,
		};

		console.log("当前视图参数:", viewParams);
		console.log("JSON 格式:", JSON.stringify(viewParams));

		// 从 fileUrl 中提取文件名
		const fileName = this.fileUrl ? this.fileUrl.split('/').pop() : "default";
		console.log("保存到文件:", fileName);

		// 保存到 localStorage
		localStorage.setItem("cad_view_" + fileName, JSON.stringify(viewParams));

		this.$Message.success("视图参数已保存！下次打开自动恢复");
		}
	} catch (e) {
		console.error("保存视图失败:", e);
		this.$Message.error("保存视图失败");
	}
  }

  /**
   * 缩放至全图
   */
  public zoomAll() {
	try {
		console.log("调用 mxcad.zoomAll()");
		if (this.mxcad && this.mxcad.zoomAll) {
		const result = this.mxcad.zoomAll();
		console.log("mxcad.zoomAll() 调用成功，返回值:", result);
		} else {
		console.warn("mxcad.zoomAll 不存在，使用命令方式");
		this.executeCommand("Mx_ZoomE");
		}
	} catch (e) {
		console.error("缩放至全图失败:", e);
	}
  }

  /**
   * 放大
   */
  public zoomIn() {
	if (this.mxDraw) {
		this.mxDraw.zoomScale(1.5);
	}
  }

  /**
   * 缩小
   */
  public zoomOut() {
	if (this.mxDraw) {
		this.mxDraw.zoomScale(0.67);
	}
  }

  /**
   * 重置视图
   */
  public resetView() {
	this.zoomAll();
  }

  /**
   * 窗口缩放
   */
  public zoomWindow() {
	this.executeCommand("BR_ZoomW", "窗口缩放");
  }

  /**
   * 重绘
   */
  public regen() {
	this.executeCommand("BR_Regen");
	this.$Message.info("正在重绘视图...");
  }

  // ============== 测量工具 ==============

  /**
   * 距离测量
   */
  public startMeasureDistance() {
	this.measureResult = "";
	this.executeCommand("BR_DimensionMeasurement", "距离测量");
  }

  /**
   * 面积测量
   */
  public startMeasureArea() {
	this.measureResult = "";
	this.executeCommand("BR_Area", "面积测量");
  }

  /**
   * 坐标测量
   */
  public startMeasureCoord() {
	this.measureResult = "";
	this.executeCommand("BR_Coord", "坐标测量");
  }

  /**
   * 角度测量
   */
  public startMeasureAngle() {
	this.measureResult = "";
	this.executeCommand("BR_AngleSurveying", "角度测量");
  }

  // ============== 批注工具 ==============

  /**
   * 绘制直线
   */
  public drawLine() {
	this.executeCommand("Mx_Line", "绘制直线");
  }

  /**
   * 绘制圆 - 直接实现
   */
  public async drawCircle() {
	if (!this.viewerReady || !MxFun) {
		this.$Message.warning("查看器未就绪");
		return;
	}

	try {
		this.currentCommand = "绘制圆形";
		const getPoint = new MrxDbgUiPrPoint();
		const worldDraw = new McEdGetPointWorldDrawObject();
		const mxObj = MxFun.getCurrentDraw();
		const circle = new MxDbCircleShape();

		circle.color = new THREE.Color("#ff0000");
		circle.startAngle = 0;
		circle.endAngle = Math.PI * 2;

		getPoint.setUserDraw(worldDraw);
		getPoint.setMessage("\n指定圆心:");

		// 第一步：指定圆心
		const centerPt = await getPoint.go();
		if (!centerPt) {
		this.currentCommand = "";
		return;
		}

		circle.center = centerPt.clone();

		// 第二步：指定半径
		worldDraw.setDraw((v: THREE.Vector3) => {
		const radius = centerPt.distanceTo(v);
		circle.radius = radius;
		worldDraw.drawCustomEntity(circle);
		});

		getPoint.setBasePt(centerPt);
		getPoint.setUseBasePt(true);
		getPoint.setMessage("\n指定半径:");

		const radiusPt = await getPoint.go();
		if (!radiusPt) {
		this.currentCommand = "";
		return;
		}

		const radius = centerPt.distanceTo(radiusPt);
		circle.radius = radius;
		circle.center = centerPt;

		mxObj.addMxEntity(circle);
		this.$Message.success("圆形绘制成功");
		this.currentCommand = "";

	} catch (e) {
		console.error("绘制圆形失败:", e);
		this.$Message.error("绘制圆形失败");
		this.currentCommand = "";
	}
  }

  /**
   * 绘制矩形 - 官方标准实现（MyRect 自定义实体做动态预览）
   */
  public async drawRect() {
	if (!this.viewerReady || !MxFun) {
		this.$Message.warning("查看器未就绪");
		return;
	}

	try {
		this.currentCommand = "绘制矩形";
		console.log("[矩形绘制] 开始绘制矩形（官方标准实现）");

		const getPoint = new MrxDbgUiPrPoint();
		const mxObj = MxFun.getCurrentDraw();

		getPoint.setMessage("\n指定第一点:");
		console.log("[矩形绘制] 等待第一点...");

		// 第一步：指定第一点
		const pt1 = await getPoint.go();
		if (!pt1) {
		console.log("[矩形绘制] 取消第一点");
		this.currentCommand = "";
		return;
		}
		console.log("[矩形绘制] 第一点:", pt1.x, pt1.y);

		// 使用官方 MyRect 实体做动态预览（重写了 worldDraw，用四条线绘制）
		const previewRect = new MyRect();
		previewRect.pt1 = pt1;
		previewRect.ang = 0;  // 正矩形，不旋转
		previewRect.color = new THREE.Color("#ff6600");
		previewRect.dLineWidth = MxFun.screenCoordLong2Doc(2);
		previewRect.lineWidthByPixels = true;

		// 动态预览
		const worldDrawComment = new McEdGetPointWorldDrawObject();
		worldDrawComment.setDraw((currentPoint: THREE.Vector3) => {
		previewRect.pt2 = currentPoint;
		worldDrawComment.drawCustomEntity(previewRect);
		});

		getPoint.setBasePt(pt1);
		getPoint.setUseBasePt(true);
		getPoint.setUserDraw(worldDrawComment);
		getPoint.setMessage("\n指定第二点:");
		console.log("[矩形绘制] 等待第二点...");

		// 第二步：指定第二点
		const pt2 = await getPoint.go();
		if (!pt2) {
		console.log("[矩形绘制] 取消第二点");
		this.currentCommand = "";
		return;
		}
		console.log("[矩形绘制] 第二点:", pt2.x, pt2.y);

		// 最终绘制：使用四条 MxDbLine 绘制矩形（保证渲染可靠）
		console.log("[矩形绘制] 开始绘制四条线...");

		const lineTop = new MxDbLine();
		lineTop.pt1 = new THREE.Vector3(pt1.x, pt1.y, 0);
		lineTop.pt2 = new THREE.Vector3(pt2.x, pt1.y, 0);
		lineTop.color = new THREE.Color("#ff6600");
		lineTop.setLineWidth(2);
		lineTop.setLineWidthByPixels(true);
		mxObj.addMxEntity(lineTop);
		console.log("[矩形绘制] 上边绘制完成");

		const lineRight = new MxDbLine();
		lineRight.pt1 = new THREE.Vector3(pt2.x, pt1.y, 0);
		lineRight.pt2 = new THREE.Vector3(pt2.x, pt2.y, 0);
		lineRight.color = new THREE.Color("#ff6600");
		lineRight.setLineWidth(2);
		lineRight.setLineWidthByPixels(true);
		mxObj.addMxEntity(lineRight);
		console.log("[矩形绘制] 右边绘制完成");

		const lineBottom = new MxDbLine();
		lineBottom.pt1 = new THREE.Vector3(pt2.x, pt2.y, 0);
		lineBottom.pt2 = new THREE.Vector3(pt1.x, pt2.y, 0);
		lineBottom.color = new THREE.Color("#ff6600");
		lineBottom.setLineWidth(2);
		lineBottom.setLineWidthByPixels(true);
		mxObj.addMxEntity(lineBottom);
		console.log("[矩形绘制] 下边绘制完成");

		const lineLeft = new MxDbLine();
		lineLeft.pt1 = new THREE.Vector3(pt1.x, pt2.y, 0);
		lineLeft.pt2 = new THREE.Vector3(pt1.x, pt1.y, 0);
		lineLeft.color = new THREE.Color("#ff6600");
		lineLeft.setLineWidth(2);
		lineLeft.setLineWidthByPixels(true);
		mxObj.addMxEntity(lineLeft);
		console.log("[矩形绘制] 左边绘制完成");

		this.$Message.success("矩形绘制成功");
		this.currentCommand = "";
		console.log("[矩形绘制] 绘制完成");

	} catch (e) {
		console.error("[矩形绘制] 绘制失败:", e);
		this.$Message.error("绘制矩形失败: " + (e as Error).message);
		this.currentCommand = "";
	}
  }

  /**
   * 绘制文字
   */
  public drawText() {
	this.executeCommand("BR_Text", "绘制文字");
  }

  /**
   * 绘制云线
   */
  public drawCloudLine() {
	this.executeCommand("BR_CloudLine", "绘制云线");
  }

  /**
   * 绘制箭头
   */
  public drawArrow() {
	this.executeCommand("BR_Arrow", "箭头批注");
  }

  /**
   * 引线标注
   */
  public drawComment() {
	this.executeCommand("BR_Comment", "引线标注");
  }

  /**
   * 删除批注
   */
  public deleteEntity() {
	this.executeCommand("Mx_DeleteEntity", "删除批注");
  }

  /**
   * 编辑文字
   */
  public editText() {
	if (!this.viewerReady || !MxFun) {
		this.$Message.warning("查看器未就绪");
		return;
	}

	const mxObj = MxFun.getCurrentDraw();
	const aryId = mxObj.getMxCurrentSelect();

	if (aryId.length === 0) {
		this.$Message.warning("请先选中要编辑的文字或引线标注");
		return;
	}

	const ent = mxObj.getMxEntity(aryId[0]);
	const typeName = ent.getTypeName();

	// 判断是否是文字或引线标注
	if (typeName === "MxDbText" || typeName === "MyText") {
		this.editTextType = "文字";
		this.editTextValue = ent.text || "";
		this.editTextEntity = ent;
		this.showEditTextModal = true;
	} else if (typeName === "MxDbLeadComment") {
		this.editTextType = "引线标注";
		this.editTextValue = ent.text || "";
		this.editTextEntity = ent;
		this.showEditTextModal = true;
	} else {
		this.$Message.warning("请选中文字或引线标注");
	}
  }

  /**
   * 确认编辑文字
   */
  public confirmEditText() {
	if (!this.editTextEntity) {
		this.$Message.error("实体不存在");
		return;
	}

	try {
		this.editTextEntity.text = this.editTextValue;
		this.editTextEntity.setNeedUpdateDisplay();
		this.$Message.success("文字修改成功");
		this.showEditTextModal = false;
		this.editTextEntity = null;
	} catch (e) {
		console.error("修改文字失败:", e);
		this.$Message.error("修改文字失败");
	}
  }

  /**
   * 取消编辑文字
   */
  public cancelEditText() {
	this.showEditTextModal = false;
	this.editTextEntity = null;
  }

  // ============== 导出工具 ==============

  /**
   * 截图
   */
  public takeScreenshot() {
	try {
		this.executeCommand("BR_WriteImage");
		this.$Message.success("截图已生成，请右键保存");
	} catch (e) {
		this.$Message.error("截图失败");
	}
  }

  /**
   * 打印
   */
  public printView() {
	this.executeCommand("BR_Print");
  }

  /**
   * 保存批注
   */
  public saveAnnotations() {
	this.executeCommand("Mx_SaveAllMxEntity");
	this.$Message.success("批注数据已保存");
  }

  // ============== 图层管理 ==============

  /**
   * 切换图层显示/隐藏
   */
  public toggleLayer(layer: any, visible: boolean) {
	try {
		if (!this.mxcad || !layer || !layer.id) { return; }

		// 获取图层记录对象
		const record = layer.id.getMcDbLayerTableRecord();
		if (record) {
		// 设置图层是否关闭
		record.isOff = !visible;
		// 更新图层状态
		layer.off = !visible;
		console.log("切换图层:", layer.name, "显示:", visible);

		// 更新图层显示状态（关键！）
		if (this.mxcad.updateLayerDisplayStatus) {
			this.mxcad.updateLayerDisplayStatus();
		}

		// 触发重绘
		if (this.mxcad.updateDisplay) {
			this.mxcad.updateDisplay();
		} else if (MxFun && MxFun.updateDisplay) {
			MxFun.updateDisplay();
		}
		}
	} catch (e) {
		console.error("切换图层失败:", e);
	}
  }

  /**
   * 定位到指定点位
   */
  public locatePoint(point: any) {
	try {
		if (!this.mxcad || !point) { return; }

		console.log("定位到点位:", point);

		// 把点位移到视图中心
		if (this.mxcad.zoomCenter) {
		this.mxcad.zoomCenter(point.x, point.y);
		}

		// 放大一点，让点位更明显
		if (this.mxcad.zoomScale) {
		this.mxcad.zoomScale(2);
		}

		this.$Message.success(`已定位到点位 P${point.index}`);
	} catch (e) {
		console.error("定位点位失败:", e);
		this.$Message.error("定位失败");
	}
  }

  /**
   * 切换点位显示/隐藏
   */
  public togglePoint(point: any) {
	try {
		if (!this.mxcad || !point || !point.id) { return; }

		// 获取实体对象
		const ent = point.id.getMcDbEntity();
		if (ent) {
		// 切换可见性
		const newVisible = !point.visible;
		ent.visible = newVisible;
		point.visible = newVisible;

		console.log("切换点位:", point.name, "显示:", newVisible);

		// 触发重绘
		if (this.mxcad.updateDisplay) {
			this.mxcad.updateDisplay();
		} else if (MxFun && MxFun.updateDisplay) {
			MxFun.updateDisplay();
		}

		this.$Message.success(`${point.name} 已${newVisible ? '显示' : '隐藏'}`);
		}
	} catch (e) {
		console.error("切换点位显示失败:", e);
		this.$Message.error("操作失败");
	}
  }

  /**
   * 获取图层颜色
   */
  public getLayerColor(colorValue: any): string {
	try {
		if (typeof colorValue === 'number') {
		return '#' + colorValue.toString(16).padStart(6, '0');
		}
		if (typeof colorValue === 'string') {
		// 如果是字符串，尝试解析
		if (colorValue.startsWith('#')) { return colorValue; }
		return '#' + colorValue;
		}
		return '#808080';
	} catch (e) {
		return '#808080';
	}
  }

  // ============== 通用方法 ==============

  /**
   * 执行命令
   */
  public executeCommand(cmd: string, commandName?: string) {
	if (!this.viewerReady || !MxFun) {
		this.$Message.warning("查看器未就绪");
		return;
	}
	try {
		MxFun.sendStringToExecute(cmd);
		if (commandName) {
		this.currentCommand = commandName;
		}
		console.log("执行命令:", cmd);
	} catch (e) {
		console.error("执行命令失败:", e);
		this.$Message.error("命令执行失败");
	}
  }

  /**
   * 停止当前命令
   */
  public stopCommand() {
	if (MxFun) {
		MxFun.stopRunCommand();
	}
	this.currentCommand = "";
  }

  /**
   * 切换面板收缩/展开
   */
  public togglePanel() {
	this.panelCollapsed = !this.panelCollapsed;
  }

  /**
   * 切换文字增强（白色文字改为黑色）
   */
  public toggleTextEnhance() {
	try {
		this.textEnhanced = !this.textEnhanced;

		// 保存到 localStorage
		localStorage.setItem("cad_viewer_text_enhanced", this.textEnhanced ? "true" : "false");

		if (this.textEnhanced) {
		this.enhanceTextColor();
		} else {
		this.restoreTextColor();
		}

		this.$Message.success(`文字增强已${this.textEnhanced ? '开启' : '关闭'}`);
	} catch (e) {
		console.error("切换文字增强失败:", e);
		this.$Message.error("操作失败");
	}
  }

  /**
   * 增强文字颜色（白色/浅色文字改为黑色）
   */
  public enhanceTextColor() {
	try {
		if (!this.mxcad) { return; }

		console.log("[文字增强] 开始处理文字颜色...");

		const database = this.mxcad.getDatabase();
		const blockTable = database.getBlockTable();
		const blockRecordIds = blockTable.getAllRecordId();

		// 获取图层表，用于判断 byLayer 颜色
		const layerTable = database.getLayerTable();
		const layerRecordIds = layerTable.getAllRecordId();
		const layerColors: Map<any, {red: number, green: number, blue: number}> = new Map();

		// 预存所有图层的颜色
		for (let i = 0; i < layerRecordIds.length; i++) {
		try {
			const layerRec = layerRecordIds[i].getMcDbLayerTableRecord();
			if (layerRec && layerRec.color) {
			layerColors.set(layerRecordIds[i], {
				red: layerRec.color.red,
				green: layerRec.color.green,
				blue: layerRec.color.blue,
			});
			}
		} catch (e) {}
		}

		console.log("[文字增强] 图层数量:", layerRecordIds.length);

		let textCount = 0;
		let changedCount = 0;
		let byLayerCount = 0;

		// 遍历所有块表记录
		for (let i = 0; i < blockRecordIds.length; i++) {
		try {
			const blkRecId = blockRecordIds[i];
			const blkRec = blkRecId.getMcDbBlockTableRecord();
			if (!blkRec) { continue; }

			const entityIds = blkRec.getAllEntityId();

			// 遍历所有实体
			for (let j = 0; j < entityIds.length; j++) {
			try {
				const entId = entityIds[j];

				// 判断是否是文字类型（包括各种文字类型）
				const isText = entId.isKindOf("McDbText");
				const isMText = entId.isKindOf("McDbMText");
				const isAttribute = entId.isKindOf("McDbAttribute");
				const isAttributeDef = entId.isKindOf("McDbAttributeDefinition");
				const isDimension = entId.isKindOf("McDbDimension");

				if (!isText && !isMText && !isAttribute && !isAttributeDef && !isDimension) { continue; }

				textCount++;

				const ent = entId.getMcDbEntity();
				if (!ent) { continue; }

				// 获取实际颜色（处理 byLayer）
				let r = 255, g = 255, b = 255;
				let isByLayer = false;

				try {
				// 先尝试获取 trueColor
				if (ent.trueColor) {
					r = ent.trueColor.red;
					g = ent.trueColor.green;
					b = ent.trueColor.blue;
				}

				// 检查是否是 byLayer（颜色索引为 256 表示 byLayer）
				if (ent.colorIndex !== undefined) {
					const colorIdx = ent.colorIndex;
					// 256 = byLayer, 0 = byBlock, 7 = 白色
					if (colorIdx === 256) {
					isByLayer = true;
					byLayerCount++;
					// 使用图层颜色
					const layerColor = layerColors.get(ent.layerId);
					if (layerColor) {
						r = layerColor.red;
						g = layerColor.green;
						b = layerColor.blue;
					}
					} else if (colorIdx === 7 || colorIdx === 255) {
					// ACI 7 = 白色（在黑底上显示为白色，白底上显示为黑色，但这里统一按白色处理）
					r = 255; g = 255; b = 255;
					}
				}
				} catch (e) {}

				// 判断是否是白色或浅色（RGB都大于150，降低阈值）
				const isLightColor = r > 150 && g > 150 && b > 150;

				if (isLightColor) {
				// 保存原始颜色
				this.originalTextColors.set(entId, {
					red: r,
					green: g,
					blue: b,
					isByLayer,
					originalColorIndex: ent.colorIndex,
				});

				// 改成黑色
				ent.trueColor = new McCmColor(0, 0, 0);
				changedCount++;
				}
			} catch (e) {}
			}
		} catch (e) {}
		}

		// 触发重绘
		if (this.mxcad.updateDisplay) {
		this.mxcad.updateDisplay();
		}
		if (this.mxcad.regen) {
		this.mxcad.regen();
		}

		console.log(`[文字增强] 处理完成：共 ${textCount} 个文字，byLayer ${byLayerCount} 个，修改 ${changedCount} 个`);
	} catch (e) {
		console.error("增强文字颜色失败:", e);
	}
  }

  /**
   * 恢复文字原始颜色
   */
  public restoreTextColor() {
	try {
		if (!this.mxcad) { return; }

		console.log("[文字增强] 恢复原始文字颜色...");

		let restoredCount = 0;

		this.originalTextColors.forEach((originalColor, entId) => {
		try {
			const ent = entId.getMcDbEntity();
			if (ent) {
			if (originalColor.isByLayer && originalColor.originalColorIndex !== undefined) {
				// 恢复 byLayer
				ent.colorIndex = originalColor.originalColorIndex;
			} else if (ent.trueColor) {
				// 恢复真彩色
				ent.trueColor = new McCmColor(originalColor.red, originalColor.green, originalColor.blue);
			}
			restoredCount++;
			}
		} catch (e) {}
		});

		// 清空保存的颜色
		this.originalTextColors.clear();

		// 触发重绘
		if (this.mxcad.updateDisplay) {
		this.mxcad.updateDisplay();
		}
		if (this.mxcad.regen) {
		this.mxcad.regen();
		}

		console.log(`[文字增强] 恢复完成：共恢复 ${restoredCount} 个文字`);
	} catch (e) {
		console.error("恢复文字颜色失败:", e);
	}
  }

  /**
   * 切换主题（浅色/深色）
   */
  public toggleTheme() {
	try {
		this.theme = this.theme === "light" ? "dark" : "light";

		// 保存到 localStorage
		localStorage.setItem("cad_viewer_theme", this.theme);

		this.$Message.success(`已切换为${this.theme === "light" ? "浅色" : "深色"}主题`);
	} catch (e) {
		console.error("切换主题失败:", e);
		this.$Message.error("切换主题失败");
	}
  }

  // ==================== 标注点功能 ====================

  /**
   * 初始化标注点点击事件监听
   * 使用 mousedown 事件，可以在 mxcad 处理之前阻止选择操作
   */
  public initAnnotationClick() {
	const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
	if (!canvas) {
		console.warn("[标注点] 未找到 canvas 元素，1秒后重试");
		setTimeout(() => this.initAnnotationClick(), 1000);
		return;
	}
	console.log("[标注点] 初始化点击事件监听");
	// 使用 mousedown 事件，在捕获阶段监听，确保优先处理
	canvas.addEventListener("mousedown", this.handleAnnotationClick, true);
	// 监听鼠标移动，悬停在标注点上时变成手型
	canvas.addEventListener("mousemove", this.handleAnnotationHover);
  }

  /**
   * 处理标注点鼠标悬停事件
   * 鼠标悬停在标注点上时，鼠标变成手型
   */
  public handleAnnotationHover(e: MouseEvent) {
	try {
		// 如果正在添加标注点，不处理
		if (this.isAddingAnnotation) { return; }

		// 如果没有标注点，恢复默认鼠标
		if (this.annotationPoints.length === 0) {
		const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
		if (canvas) { canvas.style.cursor = ""; }
		return;
		}

		const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
		if (!canvas) { return; }

		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// 使用 three.js 的 Raycaster 检测
		const mxObj = MxFun.getCurrentDraw();
		if (!mxObj) { return; }

		const scene = mxObj.getScene?.();
		const camera = mxObj.getCamera?.();

		if (!scene || !camera) { return; }

		// 把像素坐标转换成 NDC 坐标
		const ndcX = (mouseX / rect.width) * 2 - 1;
		const ndcY = -(mouseY / rect.height) * 2 + 1;

		// 创建 Raycaster
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

		// 检测点击到的对象
		const intersects = raycaster.intersectObjects(scene.children, true);

		let isHoveringAnnotation = false;
		for (const intersect of intersects) {
		const obj = intersect.object;
		if (obj && obj.userData && obj.userData.isAnnotationPoint) {
			isHoveringAnnotation = true;
			break;
		}
		}

		// 设置鼠标样式
		canvas.style.cursor = isHoveringAnnotation ? "pointer" : "";
	} catch (e) {
		// 静默处理，不影响用户体验
	}
  }

  /**
   * 处理标注点点击事件
   * 使用 three.js 的 Raycaster 直接检测点击到的对象
   */
  public handleAnnotationClick(e: MouseEvent) {
	try {
		// 如果正在添加标注点，不处理点击
		if (this.isAddingAnnotation) { return; }

		// 如果没有标注点，不处理
		if (this.annotationPoints.length === 0) { return; }

		const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
		if (!canvas) { return; }

		const rect = canvas.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		// 使用 three.js 的 Raycaster 检测点击
		const mxObj = MxFun.getCurrentDraw();
		if (!mxObj) { return; }

		const scene = mxObj.getScene?.();
		const camera = mxObj.getCamera?.();

		if (!scene || !camera) {
		console.warn("[标注点] 场景或相机不存在");
		return;
		}

		// 把像素坐标转换成 NDC 坐标（-1到1）
		const ndcX = (clickX / rect.width) * 2 - 1;
		const ndcY = -(clickY / rect.height) * 2 + 1;

		// 创建 Raycaster
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

		// 检测点击到的对象（递归检测子对象）
		const intersects = raycaster.intersectObjects(scene.children, true);

		console.log("[标注点] Raycaster检测到的对象数量:", intersects.length);

		if (intersects.length > 0) {
		console.log("[标注点] 第一个对象:", {
			name: intersects[0].object?.name,
			type: intersects[0].object?.type,
			userData: intersects[0].object?.userData,
			距离: intersects[0].distance,
		});
		console.log(intersects.length);
		// 遍历检测到的对象，查找标注点
		for (const intersect of intersects) {
			const obj = intersect.object;
			if (!obj) { continue; }

			// 通过 userData 判断是否是标注点
			if (obj.userData && obj.userData.isAnnotationPoint) {
			const annotationId = obj.userData.annotationId;
			const annotation = this.annotationPoints.find((p) => p.id === annotationId);
			if (annotation) {
				console.log("[标注点] 点击到标注点:", annotation.name);

				// 阻止默认行为和冒泡
				e.preventDefault();
				e.stopPropagation();

				// 显示标注点信息
				this.showAnnotationInfo(annotation);
				return;
			}
			}
		}
		}

		console.log("[标注点] 未点击到任何标注点");
	} catch (e) {
		console.error("[标注点] 点击事件处理失败:", e);
	}
  }

  /**
   * 开始添加标注点
   */
  public async startAddAnnotation() {
	try {
		if (!this.mxcad) {
		this.$Message.warning("查看器未就绪");
		return;
		}

		this.isAddingAnnotation = true;
		this.currentCommand = "添加标注点";

		const getPoint = new MrxDbgUiPrPoint();
		getPoint.setMessage("\n请点击标注点位置:");

		const point = await getPoint.go();
		if (!point) {
		this.isAddingAnnotation = false;
		this.currentCommand = "";
		return;
		}

		// 打开输入弹窗
		this.annotationForm = {
		name: "标注点" + (this.annotationPoints.length + 1),
		description: "",
		};
		this.selectedAnnotation = {
		x: point.x,
		y: point.y,
		z: point.z || 0,
		isNew: true,
		};
		this.showAnnotationModal = true;

	} catch (e) {
		console.error("[标注点] 开始添加失败:", e);
		this.isAddingAnnotation = false;
		this.currentCommand = "";
		this.$Message.error("添加标注点失败");
	}
  }

  /**
   * 确认添加标注点
   * 使用 three.js 直接绘制红色实心圆
   */
  public confirmAddAnnotation() {
	try {
		if (!this.selectedAnnotation || !this.selectedAnnotation.isNew) { return; }

		const mxObj = MxFun.getCurrentDraw();
		if (!mxObj) {
		this.$Message.error("获取绘图对象失败");
		return;
		}

		const { x, y, z } = this.selectedAnnotation;
		const id = "annotation_" + Date.now();

		console.log("[标注点] 创建three.js标注点:", {
		原始坐标: { x, y, z },
		});

		// 把文档坐标转换成 three.js 世界坐标
		let worldX = x, worldY = y, worldZ = z || 0;
		try {
		if (mxObj.docCoord2World) {
			const worldPos = mxObj.docCoord2World(x, y, z || 0);
			if (worldPos) {
			worldX = worldPos.x;
			worldY = worldPos.y;
			worldZ = worldPos.z;
			}
			console.log("[标注点] docCoord2World转换结果:", { worldX, worldY, worldZ });
		}
		} catch (e) {
		console.warn("[标注点] docCoord2World转换失败:", e);
		}

		// 创建蓝色实心圆（three.js）
		const radius = 50; // 半径
		const geometry = new THREE.CircleGeometry(radius, 32);
		const material = new THREE.MeshBasicMaterial({
		color: 0x1764e8, // 蓝色（和顶部导航栏一致）
		side: THREE.DoubleSide,
		transparent: false, // 不透明，确保可见
		});
		const circleMesh = new THREE.Mesh(geometry, material);
		// 使用转换后的世界坐标
		circleMesh.position.set(worldX, worldY, worldZ);

		// 设置 userData，用于点击检测
		circleMesh.userData.isAnnotationPoint = true;
		circleMesh.userData.annotationId = id;

		// 使用 mxdraw 官方的 addObject 方法添加到场景
		console.log("[标注点] 准备添加到场景，mxObj.addObject:", typeof mxObj.addObject);
		if (mxObj.addObject) {
		mxObj.addObject(circleMesh, true);
		console.log("[标注点] 已通过addObject添加到场景");
		} else {
		const scene = mxObj.getScene?.();
		if (scene) {
			scene.add(circleMesh);
			console.log("[标注点] 已通过scene.add添加到场景");
		}
		}

		// 主动触发重绘，让标注点立即显示
		this.$nextTick(() => {
		try {
			if (mxObj.updateDisplay) {
			mxObj.updateDisplay(true);
			console.log("[标注点] 已触发mxdraw重绘");
			}
			if (this.mxcad) {
			if (this.mxcad.updateDisplay) {
				this.mxcad.updateDisplay();
			}
			if (this.mxcad.regen) {
				this.mxcad.regen();
			}
			}
		} catch (e) {
			console.warn("[标注点] 触发重绘失败:", e);
		}
		});

		// 验证场景中的对象
		setTimeout(() => {
		try {
			const scene = mxObj.getScene?.();
			if (scene) {
			let found = false;
			scene.traverse((obj: any) => {
				if (obj.userData && obj.userData.isAnnotationPoint && obj.userData.annotationId === id) {
				found = true;
				console.log("[标注点] 验证：在场景中找到标注点对象", {
					位置: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
					可见: obj.visible,
					类型: obj.type,
				});
				}
			});
			if (!found) {
				console.warn("[标注点] 验证：未在场景中找到标注点对象");
			}
			}
		} catch (e) {
			console.warn("[标注点] 验证失败:", e);
		}
		}, 500);

		// 保存标注点信息（包含mesh引用）
		const annotation = {
		id,
		mesh: circleMesh,
		x,
		y,
		z: z || 0,
		name: this.annotationForm.name,
		description: this.annotationForm.description,
		createTime: new Date().toLocaleString(),
		};

		this.annotationPoints.push(annotation);

		this.showAnnotationModal = false;
		this.isAddingAnnotation = false;
		this.currentCommand = "";
		this.selectedAnnotation = null;

		// 确保退出命令状态
		this.$nextTick(() => {
		this.stopCommand();
		});

		this.$Message.success("标注点添加成功");
	} catch (e) {
		console.error("[标注点] 确认添加失败:", e);
		this.$Message.error("添加标注点失败");
	}
  }

  /**
   * 显示标注点信息
   */
  public showAnnotationInfo(annotation: any) {
	this.selectedAnnotation = { ...annotation, isNew: false };
	this.annotationForm = {
		name: annotation.name,
		description: annotation.description || "",
	};
	this.showAnnotationModal = true;
  }

  /**
   * 关闭标注点弹窗
   */
  public closeAnnotationModal() {
	this.showAnnotationModal = false;
	this.selectedAnnotation = null;
	this.isAddingAnnotation = false;
	this.currentCommand = "";
	// 确保退出命令状态
	this.$nextTick(() => {
		this.stopCommand();
	});
  }

  /**
   * 删除标注点
   */
  public deleteAnnotation() {
	try {
		if (!this.selectedAnnotation || this.selectedAnnotation.isNew) {
		this.closeAnnotationModal();
		return;
		}

		const id = this.selectedAnnotation.id;
		const mxObj = MxFun.getCurrentDraw();

		// 从场景中移除 three.js Mesh 对象
		try {
		const annotation = this.annotationPoints.find((p) => p.id === id);
		if (annotation && annotation.mesh) {
			const scene = mxObj?.getScene?.();
			if (scene) {
			scene.remove(annotation.mesh);
			}
			// 释放 geometry 和 material 资源
			if (annotation.mesh.geometry) {
			annotation.mesh.geometry.dispose();
			}
			if (annotation.mesh.material) {
			if (Array.isArray(annotation.mesh.material)) {
				annotation.mesh.material.forEach((m: any) => m.dispose());
			} else {
				annotation.mesh.material.dispose();
			}
			}
			console.log("[标注点] 已从场景中移除three.js对象");
		}
		} catch (e) {
		console.warn("[标注点] 移除three.js对象失败:", e);
		}

		// 从数组中移除
		this.annotationPoints = this.annotationPoints.filter((p) => p.id !== id);

		this.closeAnnotationModal();
		this.$Message.success("标注点已删除");
	} catch (e) {
		console.error("[标注点] 删除失败:", e);
		this.$Message.error("删除失败");
	}
  }

  /**
   * 初始化 Ctrl + 左键平移（事件模拟方式）
   * 把 Ctrl + 左键模拟成中键事件，完全复用 mxdraw 内部的平移逻辑
   */
  public initCtrlPan() {
	const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
	if (!canvas) {
		console.warn("[Ctrl平移] 未找到 canvas 元素");
		return;
	}

	console.log("[Ctrl平移] 初始化 Ctrl + 左键平移（事件模拟方式）");

	// 使用捕获阶段监听，这样可以在 mxdraw 处理之前拦截事件
	canvas.addEventListener("mousedown", this.handleCtrlPanMouseDown, true);
	canvas.addEventListener("mousemove", this.handleCtrlPanMouseMove, true);
	canvas.addEventListener("mouseup", this.handleCtrlPanMouseUp, true);
	canvas.addEventListener("mouseleave", this.handleCtrlPanMouseUp, true);
  }

  /**
   * 模拟中键事件
   */
  public simulateMiddleButtonEvent(e: MouseEvent, type: string) {
	// 创建一个新的鼠标事件，把 button 改成 1（中键）
	const simulatedEvent = new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		view: window,
		detail: 1,
		screenX: e.screenX,
		screenY: e.screenY,
		clientX: e.clientX,
		clientY: e.clientY,
		ctrlKey: false,  // 去掉 ctrlKey，避免 mxdraw 有特殊处理
		altKey: false,
		shiftKey: false,
		metaKey: false,
		button: 1,  // 中键
		buttons: 4,  // 中键按下的状态
		relatedTarget: e.relatedTarget as EventTarget,
	});

	// 在 canvas 上派发模拟的事件
	const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
	if (canvas) {
		canvas.dispatchEvent(simulatedEvent);
	}
  }

  /**
   * Ctrl + 左键平移 - 鼠标按下
   */
  public handleCtrlPanMouseDown(e: MouseEvent) {
	// 只处理 Ctrl + 左键
	if (!e.ctrlKey || e.button !== 0) {
		return;
	}

	// 如果正在执行命令，不处理平移
	if (this.currentCommand) {
		return;
	}

	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();

	console.log("[Ctrl平移] 模拟中键按下");

	// 模拟中键按下事件
	this.simulateMiddleButtonEvent(e, "mousedown");

	// 改变光标样式
	const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
	if (canvas) {
		canvas.style.cursor = "grabbing";
	}
  }

  /**
   * Ctrl + 左键平移 - 鼠标移动
   */
  public handleCtrlPanMouseMove(e: MouseEvent) {
	// 只处理 Ctrl + 左键按下的情况
	if (!e.ctrlKey || e.buttons !== 1) {
		return;
	}

	// 如果正在执行命令，不处理平移
	if (this.currentCommand) {
		return;
	}

	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();

	// 模拟中键移动事件
	this.simulateMiddleButtonEvent(e, "mousemove");
  }

  /**
   * Ctrl + 左键平移 - 鼠标释放
   */
  public handleCtrlPanMouseUp(e: MouseEvent) {
	// 只处理 Ctrl + 左键释放的情况
	if (!e.ctrlKey || e.button !== 0) {
		return;
	}

	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();

	console.log("[Ctrl平移] 模拟中键释放");

	// 模拟中键释放事件
	this.simulateMiddleButtonEvent(e, "mouseup");

	// 恢复光标样式
	const canvas = document.getElementById("mxcad") as HTMLCanvasElement;
	if (canvas) {
		canvas.style.cursor = "";
	}
  }

  /**
   * 销毁查看器
   */
  public destroyViewer() {
	try {
		if (this.mxcad && this.mxcad.destroy) {
		this.mxcad.destroy();
		}
		this.mxcad = null;
		this.mxDraw = null;
		this.viewerReady = false;
		this.currentCommand = "";
		this.measureResult = "";
	} catch (e) {
		console.warn("销毁查看器时出错:", e);
	}
  }
}
</script>

<style scoped>
.iv-cad-viewer {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
}

/* 顶部导航栏 */
.iv-cad-viewer .header-bar {
  height: 48px;
  /* background: linear-gradient(90deg, #52c41a, #73d13d); */
  background: #1764e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #fff;
  flex-shrink: 0;
}

.iv-cad-viewer .header-bar .header-left {
  display: flex;
  align-items: center;
}

.iv-cad-viewer .header-bar .header-left .logo {
  height: 28px;
  margin-right: 12px;
}

.iv-cad-viewer .header-bar .header-left .title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}

.iv-cad-viewer .header-bar .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 主内容区 */
.iv-cad-viewer .main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧面板 */
.iv-cad-viewer .left-panel {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8eaed;
  overflow-y: auto;
  flex-shrink: 0;
  position: relative;
  transition: width 0.3s ease;
}

/* 自定义滚动条样式 */
.iv-cad-viewer .left-panel::-webkit-scrollbar {
  width: 6px;
}

.iv-cad-viewer .left-panel::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.iv-cad-viewer .left-panel::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.iv-cad-viewer .left-panel::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 收缩状态 */
.iv-cad-viewer .left-panel.collapsed {
  width: 40px;
  overflow: hidden;
}

/* 收缩/展开按钮 */
.iv-cad-viewer .left-panel .panel-toggle-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
  color: #666;
  transition: all 0.3s ease;
}

.iv-cad-viewer .left-panel .panel-toggle-btn:hover {
  background: #e8eaed;
  color: #333;
}

.iv-cad-viewer .left-panel.collapsed .panel-toggle-btn {
  right: 50%;
  transform: translateX(50%);
  top: 12px;
}

/* 面板内容 */
.iv-cad-viewer .left-panel .panel-content {
  padding-top: 8px;
}

.iv-cad-viewer .left-panel .panel-section {
  margin-bottom: 12px;
}

.iv-cad-viewer .left-panel .tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}

/* 测量结果 */
.iv-cad-viewer .measure-result {
  margin-top: 12px;
}

/* 右侧 Viewer */
.iv-cad-viewer .right-panel {
  flex: 1;
  position: relative;
  background: #fff;
}

.iv-cad-viewer .right-panel.dark-theme {
  background: #000;
}

.iv-cad-viewer .right-panel .viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.iv-cad-viewer .right-panel .viewer-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 浅色主题自动颜色反转：黑底变白底，白字变黑字，彩色保持近似原色 */
.iv-cad-viewer .viewer-container.color-invert canvas {
  filter: invert(1) hue-rotate(180deg);
}

/* 加载遮罩 */
.iv-cad-viewer .right-panel .loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-content {
  text-align: center;
  color: #fff;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #52c41a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-step {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.iv-cad-viewer .right-panel .loading-overlay .loading-progress {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.iv-cad-viewer .right-panel .loading-overlay .progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #52c41a, #73d13d);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 当前命令提示 */
.iv-cad-viewer .right-panel .command-tip {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 50;
}

/* 底部状态栏 */
.iv-cad-viewer .status-bar {
  height: 28px;
  background: #fff;
  border-top: 1px solid #e8eaed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.iv-cad-viewer .status-bar .status-left,
.iv-cad-viewer .status-bar .status-right {
  display: flex;
  align-items: center;
}

.iv-cad-viewer .status-bar .status-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.iv-cad-viewer .status-bar .status-item .ivu-icon {
  margin-right: 4px;
}

.iv-cad-viewer .status-bar .status-item .status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
  margin-right: 4px;
}

.iv-cad-viewer .status-bar .status-item .status-dot.ready {
  background: #52c41a;
}

/* 图层列表 */
.iv-cad-viewer .layer-list {
  max-height: 400px;
  overflow-y: auto;
}

.iv-cad-viewer .layer-list .layer-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.iv-cad-viewer .layer-list .layer-item:last-child {
  border-bottom: none;
}

.iv-cad-viewer .layer-list .layer-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid #e8e8e8;
}

.iv-cad-viewer .layer-list .empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

/* Tab信息卡片 */
.iv-cad-viewer .info-tab-card {
  padding: 0;
}

.iv-cad-viewer .info-tab-card .ivu-tabs {
  margin: -16px -16px -16px -16px;
}

.iv-cad-viewer .info-tab-card .ivu-tabs-nav {
  padding-left: 16px;
}

.iv-cad-viewer .info-tab-card .ivu-tabs-tab {
  font-size: 14px;
}

.iv-cad-viewer .info-tab-card .ivu-tabs-content {
  padding: 12px 16px 16px 16px;
}

/* 图层数量 */
.iv-cad-viewer .layer-count {
  text-align: center;
  padding: 0;
}

.iv-cad-viewer .layer-count .count {
  font-size: 28px;
  font-weight: 600;
  color: #52c41a;
}

.iv-cad-viewer .layer-count .label {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
}

/* 图层列表面板 */
.iv-cad-viewer .layer-list-panel {
  border-top: 1px solid #e8e8e8;
  padding-top: 12px;
}

.iv-cad-viewer .layer-list-header {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.iv-cad-viewer .layer-list-scroll {
  max-height: 450px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 图层列表自定义滚动条 */
.iv-cad-viewer .layer-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.iv-cad-viewer .layer-list-scroll::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.iv-cad-viewer .layer-list-scroll::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.iv-cad-viewer .layer-list-scroll::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.iv-cad-viewer .layer-item-row {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 13px;
}

.iv-cad-viewer .layer-item-row:hover {
  background-color: #f0f7ff;
}

.iv-cad-viewer .layer-item-row.layer-off {
  opacity: 0.5;
}

.iv-cad-viewer .layer-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  border: 1px solid #ddd;
}

.iv-cad-viewer .layer-name-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}

.iv-cad-viewer .layer-eye-icon {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
  flex-shrink: 0;
}

/* 点位列表样式 */
.iv-cad-viewer .point-item-row .point-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.4;
}

.iv-cad-viewer .point-name {
  font-weight: 600;
  color: #1890ff;
  font-size: 13px;
}

.iv-cad-viewer .point-coord {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}

.iv-cad-viewer .point-desc {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iv-cad-viewer .layer-empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 16px 0;
}

/* 帮助内容 */
.iv-cad-viewer .help-content h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #333;
}

.iv-cad-viewer .help-content ul {
  padding-left: 20px;
}

.iv-cad-viewer .help-content ul li {
  margin-bottom: 6px;
  line-height: 1.6;
}

.iv-cad-viewer .help-content p {
  line-height: 1.6;
  color: #666;
}

/* 编辑文字表单 */
.edit-text-form .form-item {
  margin-bottom: 16px;
}

.edit-text-form .form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

/* 标注点弹窗样式 */
.annotation-form .form-item {
  margin-bottom: 16px;
}

.annotation-form .form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.annotation-form .coord-text {
  font-family: 'Courier New', monospace;
  color: #1764e8;
  font-size: 13px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
