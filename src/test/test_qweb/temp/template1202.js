async function* template1202(self, values, log = {}) {
  let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
  try {
      // _debug(String(template1202)); // detail code
      log["lastPathNode"] = "/t";
      log["lastPathNode"] = "/t/div";
      attrs = {};
      attrs["class"] = format("o-carousel-product-indicators %s", await self._compileToStr(values['indicatorsDivClass']));
      tagName = "div";
      yield `
      <div`;
      attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
      for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof (value) === 'string') {
              yield ' ' + String(name) + '="' + String(value) + '"';
          }
      }
      log["lastPathNode"] = "/t/div/ol";
      yield `>
          `;
      if (len(values['productImages']) > 1) {
          attrs = {};
          attrs["class"] = format("carousel-indicators %s position-static mx-auto my-0 text-left", await self._compileToStr(values['indicatorsListClass']));
          tagName = "ol";
          yield `<ol`;
          attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
          for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof (value) === 'string') {
                  yield ' ' + String(name) + '="' + String(value) + '"';
              }
          }
          log["lastPathNode"] = "/t/div/ol/t";
          yield `>
              `;
          let size_16;
          let t_foreach_15 = values['productImages'] ?? [];
          if (typeof (t_foreach_15) === 'number') {
              size_16 = t_foreach_15;
              values["productImage_size"] = size_16;
              t_foreach_15 = range(size_16);
          }
          else if ('_length' in t_foreach_15) {
              size_16 = t_foreach_15._length;
              values["productImage_size"] = size_16;
          }
          else if ('length' in t_foreach_15) {
              size_16 = t_foreach_15.length;
              values["productImage_size"] = size_16;
          }
          else if ('size' in t_foreach_15) {
              size_16 = t_foreach_15.size;
              values["productImage_size"] = size_16;
          }
          else {
              size_16 = null;
          }
          let hasValue_17 = false;
          if (t_foreach_15 instanceof Map) {
              t_foreach_15 = t_foreach_15.entries();
              hasValue_17 = true;
          }
          if (typeof t_foreach_15 === 'object' && !isIterable(t_foreach_15)) {
              t_foreach_15 = Object.entries(t_foreach_15);
              hasValue_17 = true;
          }
          for (const [index, item] of enumerate(t_foreach_15)) {
              values["productImage_index"] = index;
              if (hasValue_17) {
                  [values["productImage"], values["productImage_value"]] = item;
              }
              else {
                  values["productImage"] = values["productImage_value"] = item;
              }
              values["productImage_first"] = values["productImage_index"] == 0;
              if (size_16 != null) {
                  values["productImage_last"] = index + 1 === size_16;
              }
              values["productImage_odd"] = index % 2;
              values["productImage_even"] = !values["productImage_odd"];
              values["productImage_parity"] = values["productImage_odd"] ? 'odd' : 'even';
              log["lastPathNode"] = "/t/div/ol/t";
              log["lastPathNode"] = "/t/div/ol/t/li";
              attrs = {};
              attrs["data-target"] = "#oCarouselProduct";
              attrs["class"] = format("m-1 mb-2 align-top %s", await self._compileToStr(values['productImage_first'] ? 'active' : ''));
              attrs["data-slide-to"] = String(values['productImage_index']);
              tagName = "li";
              yield `<li`;
              attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
              for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof (value) === 'string') {
                      yield ' ' + String(name) + '="' + String(value) + '"';
                  }
              }
              log["lastPathNode"] = "/t/div/ol/t/li/div";
              tFieldTOptions = { "widget": "image", "qwebImgResponsive": false, "class": "o-image-64-contain", "alt-field": "label" };
              result = await self._getField(values['productImage'], "image128", "productImage.image128", "div", tFieldTOptions, compileOptions, values);
              [attrs, content, forceDisplay] = result;
              if (content != null && content !== false) {
                  content = await self._compileToStr(content);
              }
              yield `>
                  `;
              if (content != null && content !== false) {
                  tagName = "div";
                  yield `<div`;
                  attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                  for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof (value) === 'string') {
                          yield ' ' + String(name) + '="' + String(value) + '"';
                      }
                  }
                  yield `>`;
                  yield String(content);
                  yield `</div>`;
              }
              else {
                  tagName = "div";
                  yield `<div`;
                  attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                  for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof (value) === 'string') {
                          yield ' ' + String(name) + '="' + String(value) + '"';
                      }
                  }
                  yield `>`;
                  yield `</div>`;
              }
              log["lastPathNode"] = "/t/div/ol/t/li/i";
              yield `
                  `;
              if (values['productImage']._name == 'product.image' && await values['productImage'].embedCode) {
                  yield `<i class="fa fa-2x fa-play-circle o-product-video-thumb"></i>`;
              }
              yield `
              </li>`;
          }
          yield `
          </ol>`;
      }
      yield `
      </div>
  `;
  }
  catch (e) {
      _debug('Error in %s at %s: %s', 'template1202', log["lastPathNode"], e);
      // _debug(String(template1202)); // detail code
      throw e;
  }
}