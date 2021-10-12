

function escape(s) {
  var escaped = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  };
  return s.replace(/[&<>'"]/g, function (m) {
    return escaped[m];
  });
}

$("body").ready(() => {
  let svgCode = '';

  $("#addFile").on("change", function() {
    let fileReaders = {};

    for(let i=0; i < this.files.length; i++) {
      fileReaders[i] = new FileReader();
      fileReaders[i].readAsText(this.files[i])
      fileReaders[i].onload=function(){
        $("#frames").append(fileReaders[i].result);
        if ($("#mainScene").html().length === 0 && i === 0) {
          $("#mainScene").html(fileReaders[0].result);
          $("#mainScene svg").attr("id", 'original');
        }
      }
    }
  });
  
  $("#playButton").on("click", () => {
    let targetImage = '#original';
    let sprite      = [];
    let duration    = $("#duration").val();
    let delay       = $("#delay").val();
    let direction   = $("#direction").val();

    let frame_id = 1;
    $("#frames svg").each(function () {
      let id = `frame_${frame_id}`;
      $(this).attr('id', id);
      sprite.push('#' + id);
      frame_id++;
    });

    let svgAni = new svgAnimator();
    svgAni.animateSVG(targetImage, sprite, `${duration}s`, `${delay}s`, 'infinite', `${direction}`);
    $("#css").html(escape($(targetImage).prop('outerHTML')) + "\n\n");
    svgCode = `<style>\n${svgAni.getCSS()} \n</style>\n\n`;
    editor.session.setValue(svgCode)
  });
  
  // ACE EDITOR
    let svgAnimatorDom = document.getElementById('svgAnimator');
    var buildDom       = require("ace/lib/dom").buildDom;
    var editor         = ace.edit();

    editor.setOptions({
        theme: "ace/theme/tomorrow_night_eighties",
        mode: "ace/mode/markdown",
        maxLines: 30,
        minLines: 30,
        autoScrollEditorIntoView: true,
    });
    var refs = {};
    function updateToolbar() {
        refs.saveButton.disabled = editor.session.getUndoManager().isClean();
        refs.undoButton.disabled = !editor.session.getUndoManager().hasUndo();
        refs.redoButton.disabled = !editor.session.getUndoManager().hasRedo();
    }
    editor.on("input", updateToolbar);
    function save() {
        localStorage.savedValue = editor.getValue(); 
        editor.session.getUndoManager().markClean();
        updateToolbar();
    }
    editor.commands.addCommand({
        name: "save",
        exec: save,
        bindKey: { win: "ctrl-s", mac: "cmd-s" }
    });


    svgAnimatorDom.appendChild(editor.container);
/*    buildDom(["div", { class: "toolbar" },
        ["button", {
            ref: "saveButton",
            onclick: save
        }, "save"],
        ["button", {
            ref: "undoButton",
            onclick: function() {
                editor.undo();
            }
        }, "undo"],
        ["button", {
            ref: "redoButton",
            onclick: function() {
                editor.redo();
            }
        }, "redo"],
        ["button", {
            style: "font-weight: bold",
            onclick: function() {
                editor.insertSnippet("**${1:$SELECTION}**");
                editor.renderer.scrollCursorIntoView()
            }
        }, "bold"],
        ["button", {
            style: "font-style: italic",
            onclick: function() {
                editor.insertSnippet("*${1:$SELECTION}*");
                editor.renderer.scrollCursorIntoView()
            }
        }, "Italic"],
    ], svgAnimatorDom, refs);*/

    window.editor = editor;
});



