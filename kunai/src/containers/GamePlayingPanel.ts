class GamePlayingPanel extends egret.Sprite {
  public static GAME_END: string = 'gameend'
  public static GAME_RESTART: string = 'gamerestart'
  private bg: egret.Shape
  private endBtn: egret.TextField

  public constructor() {
    super()
    // this.init()
  }

  public start() {
    // const { endBtn, onTouchTap } = this
    // endBtn.touchEnabled = true
    // endBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, onTouchTap, this)

    const { stage } = this
    const img = new egret.Bitmap()
    img.texture = RES.getRes('4_jpg')
    img.x = 0
    img.y = 0
    img.width = stage.stageWidth
    img.height = stage.stageHeight
    img.alpha = .4
    this.addChild(img)

    this.initGame()
  }

  // private init() {
  //   this.endBtn = new egret.TextField()
  //   this.endBtn.text = '结束游戏'
  //   this.endBtn.x = 450 / 2 - this.endBtn.width
  //   this.endBtn.y = 400
  //   this.addChild(this.endBtn)
  // }

  // private onTouchTap() {
  //   this.dispatchEventWith(GamePlayingPanel.CHANG_EPANEL)
  // }

  public end() {
    this.removeChild(this.timber)
    this.removeChild(this.kunai)
    this.removeChild(this.textfield)
    this.resetGame()
  }


  private textfield: egret.TextField;
  private timber: egret.Bitmap
  private kunai: egret.Bitmap
  private timberInterval: number
  protected rotations: number = 3
  private isShooting: boolean = false
  private insertRotate: itemObj[] = []
  protected kunaiW: number = 21
  protected kunaiH:number = 100
  protected rate:number = 35
  private dialog: Dialog

  // 关数限定
  private kunaiNum: number = 9
  private level: number = 1
  private kunaiNumTips: egret.TextField

	/**
	 * 创建场景界面
	 * Create scene interface
	 */
  protected initGame(): void {
    const stageW = this.stage.stageWidth
    const stageH = this.stage.stageHeight

    this.timber = this.createBitmapByName('timber_png')
    this.addChild(this.timber)
    this.timber.width = 200
    this.timber.height = 200
    this.timber.anchorOffsetX = this.timber.width / 2
    this.timber.anchorOffsetY = this.timber.height / 2
    this.timber.x = stageW / 2
    this.timber.y = 200

    this.createText()
    this.createKunai()
    this.createKunaiNum()
    this.startAnimation()

    // 创建分享及广告
    this.share()
  }
	/**
	 * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
	 * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
	 */
  private createBitmapByName(name: string): egret.Bitmap {
    let result = new egret.Bitmap();
    let texture: egret.Texture = RES.getRes(name);
    result.texture = texture;
    return result;
  }
	/**
	 * 描述文件加载成功，开始播放动画
	 * Description file loading is successful, start to play the animation
	 */
  private startAnimation(): void {
    // this.gameover()
    if (this.timberInterval) {
      clearInterval(this.timberInterval)
    }
    this.timber.rotation = 0
    this.timberInterval = setInterval(() => {
      this.timber.rotation += this.rotations
    }, this.rate)
  }

	/**
	 * 点击按钮
	 * Click the button
	 */
  private shoot(e: egret.TouchEvent) {
    if (this.isShooting || this.kunaiNum <= 0) return
    this.isShooting = true
    this.kunaiNum -= 1
    this.updateKunaiNum()
    const func = (): void => {
      if (this.calcCollision(this.timber.rotation)) {
        // 如坐标集合里面有了，苦无插入重复的位置，弹飞新加的苦无
        this.flickKunai()
      } else {
        // 木屑
        this.woodBits()
        // 木桩被射中动画
        const timberX = this.timber.x
        const timberY = this.timber.y
        egret.Tween.get(this.timber)
          .to({ x: this.timber.x - 6, y: this.timber.y - 7 }, 20, egret.Ease.bounceInOut)
          .to({ x: timberX, y: timberY }, 20, egret.Ease.bounceInOut)

        this.createRotateKunai()

        // 判断及动画完成以后进行游戏判断
        if (this.kunaiNum <= 0) {
          this.showNext()
        }
      }
    }
    egret.Tween.get(this.kunai)
      .to({ y: 370 }, 150, egret.Ease.cubicIn)
      .call(func, this)
  }

  // 创建游戏点击区域

  private createClickable() {
    const { stage } = this
    const rect = new egret.Shape()
    rect.graphics.beginFill(0x000000, 0)
    rect.graphics.drawRect(0, stage.stageHeight - 200, stage.stageWidth, 300)
    rect.graphics.endFill()
    this.addChild(rect)
    rect.touchEnabled = true
    rect.addEventListener(egret.TouchEvent.TOUCH_TAP, this.shoot, this)
  }

  private createKunai() {
    this.kunai = this.createBitmapByName('kunai_png')
    this.addChild(this.kunai)
    const stageW = this.stage.stageWidth
    const stageH = this.stage.stageHeight
    this.kunai.width = this.kunaiW
    this.kunai.height = this.kunaiH
    this.kunai.x = stageW / 2 - 10
    this.kunai.y = stageH - 200

    this.createRandomKunai()
    this.createClickable()
  }

  private resetKunai() {
    const stageW = this.stage.stageWidth
    const stageH = this.stage.stageHeight
    this.kunai.width = 20
    this.kunai.height = 100
    this.kunai.rotation = 0
    this.kunai.x = stageW / 2 - 10
    this.kunai.y = stageH - 200

    this.isShooting = false
  }

  private createRotateKunai(kunaiRotate?: number) {
    // 数据存储木桩上的苦无坐标
    // 有kunaiRotate则是随机生成的苦无
    // 如果是用kunaiRotate做判断需要乘以-1
    const rotate = kunaiRotate ? kunaiRotate * -1 : this.timber.rotation
    const range = []
    range.push(rotate - 10)
    range.push(rotate + 10)

    // 生成木桩上的苦无
    const kunai: egret.Bitmap = this.createBitmapByName('kunai_png')
    kunai.anchorOffsetX = 5
    kunai.anchorOffsetY = -52
    kunai.x = this.stage.stageWidth / 2
    kunai.y = 200
    kunai.width = this.kunaiW
    kunai.height = this.kunaiH
    kunai.rotation = kunaiRotate ? kunaiRotate : 0
    this.addChildAt(kunai, 1)
    setInterval(() => {
      kunai.rotation += this.rotations
    }, this.rate)

    const obj = { id: rotate, range, kunai }
    this.insertRotate.push(obj)
    this.resetKunai()
  }

  private calcCollision = (rotate: number): boolean => {
    const { insertRotate } = this
    return insertRotate.some((item: itemObj): boolean => {
      return (rotate <= item.range[1] && rotate >= item.range[0])
    })
  }

  private flickKunai() {
    const func = (): void => {
      setTimeout(() => {
        this.gameover()
      }, 500)
    }

    egret.Tween.get(this.kunai)
      .to({ x: this.stage.stageWidth + 100, y: this.stage.$stageHeight + 100, rotation: 720 }, 700, egret.Ease.bounceOut)
      .call(func, this)
  }

  // 文字提示
  private createText() {
    const shape1 = new egret.Shape()
    shape1.graphics.beginFill(0x2f1810, .8)
    shape1.graphics.drawRoundRect(-10, 10, 80, 30, 10)
    shape1.graphics.endFill()
    this.addChild(shape1)

    this.textfield = new egret.TextField()
    this.addChild(this.textfield)
    this.textfield.x = 12
    this.textfield.y = 17
    this.textfield.textColor = 0xffffff
    this.textfield.textAlign = egret.HorizontalAlign.CENTER
    this.textfield.size = 14
    this.updateLevel()

    // const shape2 = new egret.Shape()
    // shape2.graphics.beginFill(0x2f1810, 5)
    // shape2.graphics.drawRoundRect(-10, 10, 100, 50, 5)
    // shape2.graphics.endFill()
    // this.addChild(shape2)

    const tips = new egret.TextField()
    this.addChild(tips)
    tips.x = 10
    tips.y = 50
    tips.textColor = 0x000000
    tips.textAlign = egret.HorizontalAlign.CENTER
    tips.size = 10
    tips.text = '射中全部苦无过关'

    const kunaiTips = new egret.TextField()
    this.addChild(kunaiTips)
    kunaiTips.x = this.stage.stageWidth - 120
    kunaiTips.y = this.stage.stageHeight - 60
    kunaiTips.textColor = 0x000000
    kunaiTips.textAlign = egret.HorizontalAlign.CENTER
    kunaiTips.size = 10
    kunaiTips.text = '点击苦无即可发射'

  }

  // 关数显示
  private updateLevel() {
    this.textfield.text = `第 ${this.level} 关`
  }

  // 绘制剩余苦无
  private createKunaiNum() {
    const kunai = this.createBitmapByName('kunai_png')
    kunai.width = 10
    kunai.height = 50
    kunai.x = 30
    kunai.y = this.stage.stageHeight - 100
    this.addChild(kunai)

    this.kunaiNumTips = new egret.TextField()
    this.addChild(this.kunaiNumTips)
    this.kunaiNumTips.x = 50
    this.kunaiNumTips.y = this.stage.stageHeight - 80
    this.kunaiNumTips.textColor = 0xFFFFFF
    this.kunaiNumTips.textAlign = egret.HorizontalAlign.LEFT
    this.kunaiNumTips.size = 14
    this.updateKunaiNum()
  }

  // 更新剩余苦无
  private updateKunaiNum() {
    this.kunaiNumTips.text = `x ${this.kunaiNum}`
  }

  // 下一关
  private showNext() {
    // const panel = new eui.Panel()
    // panel.title = '恭喜过关，点击进入下一关'
    // panel.width = 300
    // panel.height = 230
    // panel.x = this.stage.stageWidth / 2 - 150
    // panel.y = this.stage.stageHeight - 320
    // panel.addEventListener(eui.UIEvent.CLOSING, this.goNext, this)
    // this.addChild(panel)
    this.goNext()
  }

  private goNext() {
    this.level += 1
    this.kunaiNum = 9
    this.updateKunaiNum()
    this.updateLevel()
    this.cleanBitmap()
    this.createRandomKunai()
    // 重置木桩的角度并开始动画
    this.startAnimation()
  }

  // 随机生成的苦无
  private createRandomKunai() {
    // 每加一关，已插入的苦无多一把
    for (let i = 1; i < this.level; i++) {
      let random = Math.floor(Math.random() * 180)
      random = Math.random() < .5 ? random * -1 : random
      this.createRotateKunai(random)
    }
  }

  private gameover() {
    // const panel = new eui.Panel()
    // panel.title = '游戏失败，重新开始'
    // panel.width = 300
    // panel.height = 230
    // panel.x = this.stage.stageWidth / 2 - 150
    // panel.y = this.stage.stageHeight - 320
    // panel.addEventListener(eui.UIEvent.CLOSING, this.resetGame, this)
    // this.addChild(panel)
    this.dialog = new Dialog()
    this.dialog.init()
    this.addChild(this.dialog)
    this.dialog.x = this.stage.stageWidth / 2 - this.dialog._width / 2
    this.dialog.y = this.stage.stageHeight / 2 - this.dialog._height / 2
    this.dialog.addEventListener(Dialog.GO_HOME, () => {
      this.dispatchEventWith(GamePlayingPanel.GAME_END)
    }, this)
    this.dialog.addEventListener(Dialog.RESTART, () => {
      this.resetGame()
    }, this)
  }

  private resetGame() {
    this.level = 1
    this.kunaiNum = 9
    this.updateKunaiNum()
    this.updateLevel()
    this.cleanBitmap()
    this.resetKunai()
    this.createRandomKunai()
    // 重置木桩的角度并开始动画
    this.startAnimation()

    this.removeChild(this.dialog)
    this.dialog.removeEventListener(Dialog.GO_HOME, () => {
      this.dispatchEventWith(GamePlayingPanel.GAME_END)
    }, this)
    this.dialog.removeEventListener(Dialog.RESTART, () => {
      this.resetGame()
    }, this)
  }

  private cleanBitmap() {
    this.insertRotate.forEach((item: itemObj) => {
      item.kunai.parent.removeChild(item.kunai)
    })
    this.insertRotate = []
  }

  // 木屑
  private woodBits() {
    const { stageWidth, stageHeight } = this.stage
    for (let i = 0; i < 4; i++) {
      const dou = this.createBitmapByName('dou_png')
      dou.width = 5
      dou.height = 5
      dou.x = stageWidth / 2 - 1
      dou.y = 290
      this.addChild(dou)
      let random = Math.floor(Math.random() * stageWidth * 2)
      random = Math.random() < .5 ? random * -1 : random
      egret.Tween.get(dou)
        .to({ x: random, y: stageHeight }, 500, egret.Ease.sineOut)
        .call(() => {
          this.removeChild(dou)
        })
    }
  }

  private share() {
    const { stage } = this
    const s1 = this.createBitmapByName('s1_png')
    s1.width = 118 * .5
    s1.height = 107 * .5
    s1.x = stage.stageWidth - s1.width
    s1.y = stage.stageHeight - 330
    const s1y = s1.y
    this.addChild(s1)
    egret.Tween.get(s1, { loop: true }).to({ y: s1.y + 10 }, 1000).to({ y: s1y }, 1000)

    const s2 = this.createBitmapByName('s2_png')
    s2.width = 119 * .5
    s2.height = 106 * .5
    s2.x = stage.stageWidth - s1.width
    s2.y = stage.stageHeight - 250
    const s2y = s2.y
    this.addChild(s2)
    egret.Tween.get(s2, { loop: true }).to({ y: s2.y - 10 }, 1000).to({ y: s2y }, 1000)
  }
}

interface itemObj {
  id: number
  range: number[]
  kunai: egret.Bitmap
}