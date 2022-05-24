class Memo {
  constructor() {
    this.memoId =
      localStorage.getItem("memo") === null
        ? 0
        : JSON.parse(localStorage.getItem("memo"))[
            JSON.parse(localStorage.getItem("memo")).length - 1
          ].id;
    this.memoDefultWidth = "220px";
    this.memoDefultHeight = "136px";

    this.wrap = document.getElementById("wrap");
    this.memoTemplete = document.getElementById("memoTemplete").cloneNode(true);
    this.dragTarget = null;
    
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  /**
   * html을 읽어서 data객체에 맞는 값을 넣어주는 함수
   * template: string형, 
   */
  getHmtmpl = (template, data) => {
    return template.replace(/\{([\w\.]*)\}/g, (str, key) => {
      var keys = key.split("."),
        value = data[keys.shift()];
      for (let key of keys) {
        value = value[this];
      }
      return value === null || value === undefined ? "" : value;
    });
  };

  /**
   * data: 저장해야하는 데이터
   * type: ['new','edit','delete']
   */
  setData = (type, data) => {
    let memoDataList = JSON.parse(localStorage.getItem("memo")) || [];

    if (type === "new") {
      memo.memoId += 1;
      data.id = memo.memoId;
      memoDataList.push(data);
    } else if (type === "edit") {
      memoDataList = memoDataList.map((memoData) => {
        return memoData.id === data.id ? data : memoData;
      });
    } else if (type === "delete") {
      const index = memoDataList.findIndex(
        (memoData) => memoData.id === data.id
      );
      memoDataList.splice(index, 1);
    }

    localStorage.setItem("memo", JSON.stringify(memoDataList));
  };

  getData = () => {
    if (JSON.parse(localStorage.getItem("memo")) === null) {
      return false;
    }

    // NOTE: memo가 갯수만큼 추가 되려면 document.createElement가 갯수만큼 생성되어함.
    for (let localStorageMemo of JSON.parse(localStorage.getItem("memo"))) {
      let newMemo = document.createElement("div");
      newMemo.innerHTML = memo.getHmtmpl(memo.memoTemplete.innerHTML, {
        id: localStorageMemo.id,
        text: localStorageMemo.text.replace(/\n/g,"<br/>"),
      });
      newMemo.name = "memo";
      newMemo.className = "memo";
      newMemo.dataset.key = localStorageMemo.id;
      newMemo.style.top = localStorageMemo.top;
      newMemo.style.left = localStorageMemo.left;
      newMemo.style.width = `${Number(
        localStorageMemo.width.replace(/[^0-9]/g, "")
      )}px`;
      newMemo.style.height =
        `${Number(localStorageMemo.height.replace(/[^0-9]/g, ""))}px`

      newMemo.getElementsByClassName("content")[0].addEventListener(
        "input",
        (e) => {
          memo.setData("edit", {
            id: Number(newMemo.getAttribute("data-key")),
            top: newMemo.style.top,
            left: newMemo.style.left,
            width: newMemo.style.width,
            height: newMemo.style.height,
            text: e.target.innerHTML, // innerText일경우 개행처리로 인해서 innerHTML 구현
          });
        },
        newMemo
      );
      newMemo.getElementsByClassName("btn_close")[0].addEventListener(
        "click",
        (e) => {
          memo.setData("delete", {
            id: Number(newMemo.getAttribute("data-key")),
          });
          newMemo.remove();
        },
        newMemo
      );
      memo.wrap.appendChild(newMemo);
    }
  };

  handleMouseDown = (e) => {
    // 클릭시 지금의 memo객체를 dom에서 다시 호출해서 position 최상위로 인식
    // TODO: 새로고침시 position은 초기화가됨.. 이부분 추가적으로 개발 필요.
    if (e.target.className === "header") {
      memo.dragTarget = e.target.parentNode;
      memo.dragTarget.key = "move";
      memo.dragTarget.parentNode.append(memo.dragTarget);
    } else if (e.target.className === "textarea") {
      memo.dragTarget = e.target.parentNode.parentNode;
      memo.dragTarget.key = "textarea";
      memo.dragTarget.parentNode.append(memo.dragTarget);
    } else if (e.target.className === "btn_size") {
      memo.dragTarget = e.target.parentNode.parentNode;

      const styles = window.getComputedStyle(memo.dragTarget);
      memo.dragTarget.key = "resize";
      memo.dragTarget.custom = {
        clickX: e.clientX,
        clickY: e.clientY,
        dragTargetWidth: parseInt(styles.width, 10),
        dragTargetHeight: parseInt(styles.height, 10),
      };

      memo.dragTarget.parentNode.append(memo.dragTarget);
    }
  };

  handleMouseUp = (e) => {
    memo.dragTarget = null;
  };

  handleMouseMove = (e) => {
    // 마우스 클릭했을때에만 클릭한 객체를 생성되어서 dragTarget없으면 예외처리
    if (memo.dragTarget === null) {
      return false;
    }

    if (memo.dragTarget.key == "move") {
      const boxRect = memo.dragTarget.getBoundingClientRect();

      memo.dragTarget.style.top = `${boxRect.top + e.movementY}px`;
      memo.dragTarget.style.left = `${boxRect.left + e.movementX}px`;
      memo.dragTarget.style.width =
        memo.dragTarget.getElementsByClassName("textarea")[0].clientWidth;
      memo.dragTarget.style.height =
        memo.dragTarget.getElementsByClassName("textarea")[0].clientHeight;
    } else if (memo.dragTarget.key == "resize") {
      const dragTargetStyle = memo.dragTarget.custom;

      const width =
        dragTargetStyle.dragTargetWidth + e.clientX - dragTargetStyle.clickX;
      const height =
        dragTargetStyle.dragTargetHeight + e.clientY - dragTargetStyle.clickY;

      // 최소 크기보다 작을때 예외처리
      memo.dragTarget.style.width =
        width <= 220 ? memo.memoDefultWidth : `${width}px`;
      memo.dragTarget.style.height =
        width <= 136 ? memo.memoDefultHeight : `${width}px`;
    }

    memo.setData("edit", {
      id: Number(memo.dragTarget.getAttribute("data-key")),
      top: memo.dragTarget.style.top,
      left: memo.dragTarget.style.left,
      width: memo.dragTarget.style.width,
      height: memo.dragTarget.style.height,
      text: memo.dragTarget.getElementsByClassName("textarea")[0].innerText,
    });
  };

  handleContextmenu = (e) => {
    e.preventDefault();

    const newMemo = document.createElement("div");
    newMemo.innerHTML = memo.getHmtmpl(memo.memoTemplete.innerHTML, {
      id: memo.memoId,
    });
    newMemo.name = "memo";
    newMemo.className = "memo";
    newMemo.dataset.key = memo.memoId;
    newMemo.style.top = `${e.pageY}px`;
    newMemo.style.left = `${e.pageX}px`;
    newMemo.style.width = memo.memoDefultWidth;
    newMemo.style.height = memo.memoDefultHeight;

    /**
     * 메모생성시 이벤트 할당
     * (content에 text입력시 수정, 삭제버튼 클릭시 memo삭제)
     * */
    newMemo.getElementsByClassName("content")[0].addEventListener(
      "input",
      (e) => {
        memo.setData("edit", {
          id: Number(newMemo.getAttribute("data-key")),
          top: newMemo.style.top,
          left: newMemo.style.left,
          width:
            newMemo.parentNode.style.width === ""
              ? memo.memoDefultWidth
              : newMemo.parentNode.style.width,
          height:
            newMemo.parentNode.style.height === ""
              ? memo.memoDefultHeight
              : newMemo.parentNode.style.height,
          text: e.target.innerHTML, // innerText일경우 개행처리로 인해서 innerHTML 구현
        });
      },
      newMemo
    );
    newMemo.getElementsByClassName("btn_close")[0].addEventListener(
      "click",
      (e) => {
        memo.setData("delete", {
          id: Number(newMemo.getAttribute("data-key")),
        });
        newMemo.remove();
      },
      newMemo
    );

    memo.setData("new", {
      id: memo.memoId,
      top: newMemo.style.top,
      left: newMemo.style.left,
      width: memo.memoDefultWidth,
      height: memo.memoDefultHeight,
      text: "",
    });
    memo.wrap.appendChild(newMemo);
  };

  init() {
    this.getData();
    this.wrap.addEventListener("contextmenu", this.handleContextmenu);
    this.wrap.addEventListener("mousedown", this.handleMouseDown);
    this.wrap.addEventListener("mousemove", this.handleMouseMove);
    this.wrap.addEventListener("mouseup", this.handleMouseUp);
  }
}
const memo = new Memo();
memo.init();
