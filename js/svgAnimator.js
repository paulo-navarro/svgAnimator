class svgAnimator {

  constructor() {
    this.animationCounter  = 0;
    this.classPrefix       = 'svgAnimator';
    this.keyframePrefix    = 'svgA';
    this.cssAnimation      = document.createElement('style');
    this.cssAnimation.type = 'text/css';
    this.styles            = '';
    this.keyframes         = '';

    this.animatableStyles  = ['opacity', 'fill', 'fill-opacity', 'stroke','stroke-width','stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity'];
    this.animatableAttrs   = ['x', 'y', 'cx', 'cy', 'rx', 'ry'];
    this.transformRegex    = {'matrix': /(?<=matrix\()(.*)(?=\))/i, 'rotate':/(?<=rotate\()(.*)(?=\))/i,'translate':/(?<=translate\()(.*)(?=\))/i}

    document.getElementsByTagName("head")[0].appendChild(this.cssAnimation);
  }

  animateSVG(target, frames, duration, delay, iterationCount, direction) {
    let children = $(target).find('*');

    children.each((key, child) => {
      if($(child).attr('id')){
        let childId         = `#${$(child).attr('id')}`;
        this.changeAttributes(childId)
        let curves          = this.getFramesAttribute(childId, frames, 'd');
        let transforms      = this.getFramesTransforms(childId, frames);
        let transformOrigin = this.getFramesTransformOrigin(childId, frames);

        let params = {};
        
        if(this.valueChange(curves)) {
          params['curves'] = curves;
        }

        if(this.valueChange(transforms)) {
          params['transforms'] = transforms;
        }

        if(this.valueChange(transformOrigin)) {
          params['transforms-origin'] = transformOrigin;
          $(childId).css('transform-box', 'fill-box');
        }

        for (let i = 0; i < this.animatableStyles.length; i++) {
          let param  = this.animatableStyles[i];
          let styles = this.getFramesStyle(childId, frames, param);

          if(this.valueChange(styles)) {console.log('')
            params[param] = styles;
          }
        }

        let attrs = {};
        for (let i = 0; i < this.animatableAttrs.length; i++) {
          let attr      = this.animatableAttrs[i];
          let attribute = this.getFramesAttribute(childId, frames, attr);
          
          if(this.valueChange(attribute)) {
            params[attr]  = attribute;
          }
        }

        params = {...params};

        let keyframes = this.getKeyframes(`${this.keyframePrefix}_${this.animationCounter}`, params);

        if(keyframes) {
          this.styles    += this.getStyle(target, childId, `${this.keyframePrefix}_${this.animationCounter} ${duration} ${delay} ${iterationCount} ${direction}`);
          this.keyframes += keyframes;

          ++this.animationCounter;
        }
      }
    });
    
    let rules = document.createTextNode(`${this.styles}${this.keyframes}`);
    this.cssAnimation.appendChild(rules);

    $(target).addClass(`${this.classPrefix}`);
  }
  
  valueChange (list) {
    let firstValue = list[0];

    for (let i = 1; i < list.length; i++) {
      if (firstValue !== list[i]) {
        return true;
      }
    }

    return false;
  }
  
  changeAttributes(id) {
    let item = $(id);
    let attrToRemove = []

    item.each(function() {
      $.each(this.attributes, function() {
        if(this.specified) {
          if(this.name.startsWith('inkscape')) {
            console.log(this.name, this.value);
            attrToRemove.push(this.name)
          }
        }
      });
    });

    //$(attrToRemove).each((attr) => {
    //  item.removeAttr(attr)
    //})
  }
  
  getCSS() {
    return `${this.styles}${this.keyframes}`;
  }

  getFramesTransforms(id, frames) {
    let transforms = [];

    for (let i = 0; i < frames.length; i++) {
      let frameItem = $(frames[i]).find(`${id}`);
      let transform = frameItem.attr('transform');

      if (transform !== undefined) {
        let translate = this.getTransformValue(transform, 'translate', 'px', 2);
        let rotate    = this.getTransformValue(transform, 'rotate', 'deg', 1);
        let matrix    = this.getTransformValue(transform, 'matrix', '');

        transforms.push(`${translate}${rotate}${matrix}`);
      }
    }

    return transforms;
  }

  getFramesTransformOrigin(id, frames) {
    let transformOrigins = [];
    let item = $(id);

    for (let i = 0; i < frames.length; i++) {
      let frameItem = $(frames[i]).find(`${id}`);
      let transform = frameItem.attr('transform');

      if (transform !== undefined) {
        let rotate      = this.getTransformValue(transform, 'rotate', 'deg', 1);
        let rotateValue = transform.match(this.transformRegex['rotate']);

        let transformOrigin = '';
        
        if(rotateValue && rotateValue.length > 0) {
          let transformOriginValue = rotateValue[0].split(',');
          let itemX= parseFloat(transformOriginValue[1]) - item.get(0).getBBox().x
          let itemY= parseFloat(transformOriginValue[2]) - item.get(0).getBBox().y
          let coma = '';
          
          if(transformOriginValue[1] && transformOriginValue[2] ) {
            transformOrigin = `${itemX}px ${itemY}px`
          }

          transformOrigins.push(`${transformOrigin}`);
        }
      }
    }

    return transformOrigins;
  }

  getTransformValue(transform, property, unit, maxIterations) {
    let values = transform.match(this.transformRegex[property]);

    let parsedValue = '';

    if(values && values.length > 0) {
      parsedValue = `${property}(`;
      let value = values[0].split(',');
      let coma = '';

      maxIterations = maxIterations && maxIterations < value.length ? maxIterations : value.length;

      for(let i=0; i < maxIterations; i++) {
        parsedValue += `${coma}${value[i]}${unit}`;
        coma = ", ";
      }
      parsedValue += ")";
    }

    return parsedValue;
  }

  getFramesAttribute(id, frames, attr) {
    let attrs = [];
    for (let i = 0; i < frames.length; i++) {
      let item = $(frames[i]).find(`${id}`);
      attrs.push(item.attr(`${attr}`));
    }

    return attrs;
  }

  getFramesStyle(id, frames, attr) {
    let attrs = [];
    for (let i = 0; i < frames.length; i++) {
      let item = $(frames[i]).find(`${id}`);
      attrs.push(item.css(`${attr}`));
    }

    return attrs;
  }

  getKeyframes(name, items) {
    let key = 0;
    if (items.length === 0 || Object.keys(items)[0] === undefined) {

      return null;
    } else {

      let totalFrames = items[Object.keys(items)[0]].length;

      let percentagePerFrame = 100 / (totalFrames - 1);
      let keyframes = `\n\n  @keyframes ${name} {\n`;
      let haveAttributes = false;

      for (let i = 0; i < totalFrames; i++) {

        let styles = '';
        for (let i2 = 0; i2 < this.animatableStyles.length; i2++) {
          let animatableStyle = this.animatableStyles[i2];
          styles += items[animatableStyle] && items[animatableStyle][i] && items[animatableStyle][i] !== 'none'? this.formatAsAttribute(`${animatableStyle}: ${items[animatableStyle][i]}`) : '';
        }
        for (let i2 = 0; i2 < this.animatableAttrs.length; i2++) {
          let animatableAttr = this.animatableAttrs[i2];
          styles += items[animatableAttr] && items[animatableAttr][i] && items[animatableAttr][i] !== 'none'? this.formatAsAttribute(`${animatableAttr}: ${items[animatableAttr][i]}`) : '';
        }

        styles += items['transform-origin'] && items['transform-origin'][i] && items['transform-origin'][i] !== ''? this.formatAsAttribute(`transform-origin: ${items['transform-origin'][i]}`): ''; 
        //styles += this.formatAsAttribute('transform-box: fill-box');
        let d         = items.curves && items.curves[i]? this.formatAsAttribute(`d:path('${items.curves[i]}')`) : '';
        let transform = items.transforms && items.transforms[i]? this.formatAsAttribute(`transform: ${items.transforms[i]}`) : '';

        if(`${d}${styles}${transform}` !== '') {
          haveAttributes = true;
        }

        keyframes += `    ${key.toFixed(4)}% {\n${d}${styles}${transform}    }\n`;
        key += percentagePerFrame;

        if (key > 100) {
          key = 100;
        }
      }

      keyframes += `  }`.toLowerCase();

      return haveAttributes ? keyframes : null;
    }
  }

  getStyle(target, childId, animation) {
    return `\n  ${target}.${this.classPrefix} ${childId} \{ \n    animation: ${animation};\n \ }\n`;
  }
  
  formatAsAttribute(attribute) {
    return `      ${attribute};\n`;
  }
}



