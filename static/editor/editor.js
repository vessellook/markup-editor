function Canvas(imgUrl) {
  let viewer = OpenSeadragon({
    element: document.getElementById("openseadragon"),
    prefixUrl: "static/editor/images/",
    tileSources: {
      type: "image",
      url: imgUrl,
    }
  });

  let anno = this.anno = OpenSeadragon.Annotorious(viewer, {
    widgets: [
      'COMMENT',
      {widget: 'TAG', vocabulary: ['Вязь', 'Буквица', 'Текст', 'Пометка']},
    ],
    messages: {
      "Add a comment...": "Добавить комментарий...",
      "Add a reply...": "Ответить...",
      "Add tag...": "Добавить метку...",
      "Cancel": "Отмена",
      "Close": "Закрыть",
      "Edit": "Изменить",
      "Delete": "Удалить",
      "Ok": "Готово",
    }
  });
  Annotorious.Toolbar(anno, document.getElementById('toolbar'));
  Annotorious.BetterPolygon(anno);

  anno.setAuthInfo({
    id: "some id",
    displayName: "anonymous"
  });

  let icons = {
    "rect": document.querySelector('.a9s-toolbar-btn.rect svg'),
    "polygon": document.querySelector('.a9s-toolbar-btn.polygon svg'),
  };

  // Load annotations in W3C WebAnnotation format
  //anno.loadAnnotations('annotations.w3c.json');

  document.getElementById('save')
    .addEventListener('click', function () {
    let annotations = anno.getAnnotations()
      .map((webAnnotation) => new SimpleAnnotation(webAnnotation));
    console.log("saving annotations...", annotations);
    // fetch('/some-url', {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json;charset=utf-8",
    //   },
    //   body: JSON.stringify(annotations),
    // }).then(() => console.log('annotations were sent'), console.log);
  });

  let blocks = document.getElementById('annotations');

  // Attach handlers to listen to events
  anno.on('createAnnotation', function (webAnnotation) {
    let annotation = new SimpleAnnotation(webAnnotation);
    blocks.appendChild(createBlock(annotation));
    console.log('createAnnotation', webAnnotation, annotation);
  });
  anno.on('updateAnnotation', function (webAnnotation) {
    let annotation = new SimpleAnnotation(webAnnotation);
    let oldBlock = blocks.children.namedItem(annotation.id);
    blocks.insertBefore(createBlock(annotation), oldBlock);
    oldBlock.remove();
    console.log('updateAnnotation', webAnnotation, annotation);
  });

  anno.on('deleteAnnotation', function (webAnnotation) {
    console.log('deleteAnnotation', webAnnotation, new SimpleAnnotation(webAnnotation));
  });

  anno.on('selectAnnotation', function (webAnnotation) {
    selectBlock(webAnnotation.id);
    console.log('selectAnnotation', webAnnotation, new SimpleAnnotation(webAnnotation));
  });

  anno.on('cancelSelected', function () {
    selectBlock(null);
    console.log('cancelSelected');
  });

  function selectBlock(id) {
    for (let block of blocks.getElementsByClassName('annotation')) {
      block.classList.remove('annotation_selected');
    }
    let block = blocks.children.namedItem(id);
    if (block) {
      block.classList.add('annotation_selected');
    }
  }

  /**
   * @param {SimpleAnnotation} annotation
   */
  function createBlock(annotation) {
    let block = document.createElement('div');
    block.setAttribute('name', annotation.id);
    block.classList.add('annotation');
    block.addEventListener('click', () => {
      selectBlock(annotation.id);
      anno.selectAnnotation(annotation.id);
    });
    let icon = document.createElement('div');
    icon.classList.add('annotation__icon');
    icon.appendChild(icons[annotation.type].cloneNode(true));
    block.appendChild(icon);
    let tagElements = document.createElement('div');
    tagElements.classList.add('annotation__tags');
    for (let tag of annotation.tags) {
      let tagElement = document.createElement('div');
      tagElement.classList.add('annotation__tag');
      tagElement.innerText = tag;
      tagElements.appendChild(tagElement);
    }
    block.appendChild(tagElements);
    for (let comment of annotation.comments) {
      block.appendChild(document.createElement('hr'));
      let commentElement = document.createElement('div');
      commentElement.classList.add('annotation__comment');
      commentElement.innerText = comment;
      block.appendChild(commentElement);
    }
    return block;
  }
}

function SimpleAnnotation(webAnnotation) {
  this.id = webAnnotation.id;
  this.comments = webAnnotation.body.filter(message => message.purpose === 'commenting').map(message => message.value);
  this.tags = webAnnotation.body.filter(message => message.purpose === 'tagging').map(message => message.value);
  this.source = webAnnotation.target.source;
  switch (webAnnotation.target.selector.type) {
    case "SvgSelector":
      this.type = "polygon";
      //<svg><polygon points="944.4996337890625,773.7771606445312 2034.228759765625,1741.6282958984375 1151.6802978515625,2163.383056640625 441.7546691894531,1058.58740234375" /></svg>
      this.coordinates = webAnnotation.target.selector.value
        .slice('<svg><polygon points="'.length, -'" /></svg>'.length)
        .split(' ')
        .map(pair => pair.split(',').map(value => Number(value)));
      break;
    case "FragmentSelector":
      this.type = "rect";
      // xywh=pixel:482.0818176269531,2347.43212890625,1043.1287536621094,530.526123046875
      let values = webAnnotation.target.selector.value
        .slice('xywh=pixel:'.length)
        .split(',')
        .map(value => Number(value));
      let [x, y, w, h] = values;
      this.coordinates = [[x, y], [x, y + h], [x + w, y + h], [x + w, y]];
      break;
  }
}

let url = new URL(window.location).searchParams.get('img');
let canvas = new Canvas(url);
