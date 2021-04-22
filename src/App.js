import logo from "./logo.svg";
import "./App.css";
import "./css/src/scss/main.css";
import "font-awesome/css/font-awesome.min.css";
import React, { Component } from "react";
import Editor from "@monaco-editor/react";
import { Button, Col, Container, FormControl, FormLabel, Image, InputGroup, Row, ToggleButton } from "react-bootstrap";
import loader from "@monaco-editor/loader";
import ifcSyntax from "./models/ifcSyntax.js";
import schemaUrls from "./models/schemaUrls.js";
import FormFileInput from "react-bootstrap/esm/FormFileInput";
import JSZip from "jszip/dist/jszip.js";

var app = {};
var editorRef = {};
class App extends Component {
  state = {
    fontSize: 14,
    darkMode: true,
    pointers: [],
    fileName: "IFC SAMPLE FILE",
    schema: "IFC4",
    ifc: `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition'),'2;1');
FILE_NAME('IFC SAMPLE FILE');
FILE_SCHEMA (('IFC4'));
ENDSEC;

DATA;
#572= IFCBSPLINESURFACEWITHKNOTS(3,3,((#573,#574,#575,#576,#573,#574,#575),(#577,#578,#579,#580,#577,#578,#579),(#581,#582,#583,#584,#581,#582,#583),(#585,#586,#587,#588,#585,#586,#587)),.UNSPECIFIED.,.F.,.T.,.F.,(4,4),(1,1,1,1,1,1,1,1,1,1,1),(0.0,15.4213505620632),(-3.0,-2.0,-1.0,0.0,1.0,2.0,3.0,4.0,5.0,6.0,7.0),.UNSPECIFIED.);
#573= IFCCARTESIANPOINT((-457.685108750141,177.051077752299,0.0));
#574= IFCCARTESIANPOINT((0.0,314.739310246865,0.0));
#575= IFCCARTESIANPOINT((457.685108750143,177.051077752302,0.0));
#576= IFCCARTESIANPOINT((0.0,-318.77998625438,0.0));
#577= IFCCARTESIANPOINT((-385.042810345109,182.098571627615,-31.333333333333));


#578= IFCCARTESIANPOINT((0.0,301.690157997063,-31.333333333333));
#579= IFCCARTESIANPOINT((385.04281034511,182.098571627617,-31.333333333333));
#580= IFCCARTESIANPOINT((0.0,-248.564401002992,-31.333333333333));
#581= IFCCARTESIANPOINT((-312.400511940076,187.146065502931,-62.666666666666));

#582= IFCCARTESIANPOINT((0.0,288.64100574726,-62.666666666666));
#583= IFCCARTESIANPOINT((312.400511940078,187.146065502933,-62.666666666666));
#584= IFCCARTESIANPOINT((0.0,-178.348815751603,-62.6666666666661));
#585= IFCCARTESIANPOINT((-239.758213535044,192.193559378247,-93.9999999999991));
#586= IFCCARTESIANPOINT((0.0,275.591853497458,-93.9999999999991));
#587= IFCCARTESIANPOINT((239.758213535045,192.193559378248,-93.9999999999991));
#588= IFCCARTESIANPOINT((0.0,-108.133230500215,-93.9999999999991));

ENDSEC;
END-ISO-10303-21;`,
    fileSize: 0,
    uncompressedSize: 0,
  };

  constructor() {
    super();
    app = this;
    console.log(app);
  }

  handleEditorWillMount = (monaco) => {
    // const NOT_DIG_REGEXP = new RegExp(/\D/);
    monaco.languages.register({ id: "ifc" });
    monaco.languages.setMonarchTokensProvider("ifc", ifcSyntax);

    monaco.languages.onLanguage("ifc", function () {
      monaco.languages.registerHoverProvider("ifc", {
        getStepReferenceIdFromDocument(document, position) {
          //Check to see if the mouse is hovered over a # symbol and pull the position back by one, since
          //# does not count as a word
          let r1 = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1);
          let firstChar = document.getValueInRange(r1);
          if (firstChar == "#") position.column++;

          //Get the word at the position of the mouse (or the adjusted position)
          let wordAtPosition = document.getWordAtPosition(position);

          //create a monaco range for the position
          let range = new monaco.Range(
            position.lineNumber,
            wordAtPosition.startColumn - 1,
            position.lineNumber,
            wordAtPosition.endColumn
          );
          //get the characters within the range
          let ref = document.getValueInRange(range);

          //adjust the start column if hashtag
          if (ref.startsWith("#")) {
            wordAtPosition.word = `#${wordAtPosition.word}`;
            wordAtPosition.startColumn--;
          }
          return wordAtPosition;
        },

        provideHover(document, position, token) {
          //Get the reference text
          let refText = this.getStepReferenceIdFromDocument(document, position);
          //Check if the reference is an entity label or a schema definition.
          if (refText.word.startsWith("#")) {
            let lineCount = document.getLineCount();
            for (let index = 1; index <= lineCount; index++) {
              let line = document.getLineContent(index);
              let matches = line.match(/[#]\d+/);
              if (matches?.length == 1 && matches[0] == refText.word) {
                //Return the range and text to display in hover
                return {
                  range: new monaco.Range(
                    position.lineNumber,
                    refText.startColumn,
                    position.lineNumber,
                    refText.endColumn
                  ),
                  contents: [{ value: line }],
                };
              }
            }
          } else if (refText.word.startsWith("IFC")) {
            //Get the schema specific URL for Ifc type

            let schemaUrl = schemaUrls[app.state.schema].find(
              (s) => s.EntityLabel.toLowerCase() == refText.word.toLowerCase()
            );
            if (schemaUrl != undefined) {
              //Return the range and text to display in hover
              return {
                range: new monaco.Range(
                  position.lineNumber,
                  refText.startColumn,
                  position.lineNumber,
                  refText.endColumn
                ),
                contents: [
                  { value: `##### ${schemaUrl.EntityLabel}` },
                  { value: `IFC Schema: ${app.state.schema}` },
                  { value: `View schema definition: ${schemaUrl.URL}` },
                ],
              };
            }
          }
          return null;
        },
      });

      monaco.languages.registerDefinitionProvider("ifc", {
        getStepReferenceIdFromDocument(document, position) {
          //Check to see if the mouse is hovered over a # symbol and pull the position back by one, since
          //# does not count as a word
          let r1 = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1);
          let firstChar = document.getValueInRange(r1);
          if (firstChar == "#") position.column++;

          //Get the word at the position of the mouse (or the adjusted position)
          let wordAtPosition = document.getWordAtPosition(position);

          //create a monaco range for the position
          let range = new monaco.Range(
            position.lineNumber,
            wordAtPosition.startColumn - 1,
            position.lineNumber,
            wordAtPosition.endColumn
          );
          //get the characters within the range
          let ref = document.getValueInRange(range);

          //adjust the start column if hashtag
          if (ref.startsWith("#")) {
            wordAtPosition.word = `#${wordAtPosition.word}`;
            wordAtPosition.startColumn--;
          }
          return wordAtPosition;
        },

        provideDefinition(document, position, token) {
          let refText = this.getStepReferenceIdFromDocument(document, position);
          if (refText.word.startsWith("#")) {
            let lineCount = document.getLineCount();
            for (let i = 1; i <= lineCount; i++) {
              let line = document.getLineContent(i);
              let matches = line.match(/[#]\d+/);
              if (matches?.length == 1 && matches[0] == refText.word) {
                //Return the line number

                return {
                  uri: editorRef.getModel().uri,
                  range: new monaco.Range(i, 1, i, 1),
                };
              }
            }
          }
          return undefined;
        },
      });
    });
  };

  handleEditorDidMount = (editor, monaco) => {
    const editorService = editor._codeEditorService;
    const openEditorBase = editorService.openCodeEditor.bind(editorService);
    editorRef = editor;
  };

  handleOpenIfc = (evt) => {
    const pointers = [...this.state.pointers];
    let file = evt.target.files[0];
    this.setState({ fileSize: file.size });
    if (file === undefined) return;

    let ext = file.name.match(/(?:\.([^.]+))?$/)[1];
    if (ext.toLowerCase() === "ifczip") {
      // var ifczip = new JSZip();
      JSZip.loadAsync(file) // 1) read the Blob
        .then(
          function (zip) {
            for (var name in zip.files) {
              zip
                .file(name)
                .async("string")
                .then((z) => {
                  app.setState({ fileName: name });
                  app.setState({ uncompressedSize: z.length });
                  let lines = z.split(/\r?\n/);
                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineTrim = line.trim();
                    if (lineTrim.indexOf("FILE_SCHEMA") != -1) {
                      const matches = lineTrim.match(/(\s*\(\s*){2}'(.*)'(\s*\)\s*){2}/);
                      if (matches.length == 4) {
                        app.setState({ schema: matches[2] });
                        app.schema = matches[2];
                        break;
                      }
                    }
                  }
                  app.setState({ ifc: z });
                });

              break;
            }

            // var dateAfter = new Date();
            // $title.append($("<span>", {
            //     "class": "small",
            //     text:" (loaded in " + (dateAfter - dateBefore) + "ms)"
            // }));

            // zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
            //     $fileContent.append($("<li>", {
            //         text : zipEntry.name
            //     }));
            // });
          },
          function (e) {
            // $result.append($("<div>", {
            //     "class" : "alert alert-danger",
            //     text : "Error reading " + f.name + ": " + e.message
            // }));
          }
        );
    } else {
      this.setState({ fileName: file.name });
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        //TODO: Handle ZIP
        let lines = reader.result.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineTrim = line.trim();
          if (lineTrim.indexOf("FILE_SCHEMA") != -1) {
            const matches = lineTrim.match(/(\s*\(\s*){2}'(.*)'(\s*\)\s*){2}/);
            if (matches.length == 4) {
              this.setState({ schema: matches[2] });
              this.schema = matches[2];
              break;
            }
          }
        }
        this.setState({ ifc: reader.result });
      };
      reader.onerror = function () {
        console.log(reader.error);
      };
    }
  };

  handleEditorChange = (evt) => {
    this.setState({ ifc: evt.target.value });
  };

  changeFont = (increment) => {
    let val = increment ? 1 : -1;
    const fontSize = this.state.fontSize + val;
    this.setState({ fontSize });
  };

  toggleDarkMode = () => {
    const darkMode = !this.state.darkMode;
    this.setState({ darkMode });
  };

  render() {
    return (
      <Container id="page-container" fluid={true}>
        <Row id="header" className="text-light">
          <Col xs="auto">
            <Image src="/IfcXplorer/apple-touch-icon.png" width="30rem" className="m-2"></Image>
            <span id="logo" className="text-light">
              IFCXplorer
            </span>
          </Col>
          <Col xs="auto">
            <FormLabel htmlFor="file-upload" className="custom-file-upload btn btn-sm btn-secondary m-2">
              <i className="fa fa-folder-open" aria-hidden="true"></i>&nbsp;Open IFC
            </FormLabel>
            <FormFileInput
              id="file-upload"
              className="btn btn-primary m-2"
              accept=".ifc,.ifczip"
              onChange={(e) => this.handleOpenIfc(e)}
            />
          </Col>
          <Col xs="auto">
            <InputGroup size="sm" className="m-2">
              <InputGroup.Prepend>
                <InputGroup.Text size="sm" variant="dark">
                  Font Size
                </InputGroup.Text>
                <Button size="sm" variant="secondary" onClick={() => this.changeFont()}>
                  <i className="fa fa-minus" aria-hidden="true"></i>
                </Button>
              </InputGroup.Prepend>
              <FormControl
                size="sm"
                aria-describedby="basic-addon1"
                className="bg-dark text-light"
                disabled
                style={{ width: "50px" }}
                onChange={() => {}}
                value={this.state.fontSize}
              />
              <InputGroup.Append>
                <Button size="sm" variant="secondary" onClick={() => this.changeFont(true)}>
                  <i className="fa fa-plus" aria-hidden="true"></i>
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
          <Col xs="auto">
            <Button size="sm" className="m-2" variant="secondary" onClick={() => this.toggleDarkMode()}>
              {this.state.darkMode ? <i className="fa fa-eye-slash"></i> : <i className="fa fa-eye"></i>}
            </Button>
          </Col>
        </Row>
        <main>
          <Editor
            id="monacoEditor"
            beforeMount={this.handleEditorWillMount}
            onMount={this.handleEditorDidMount}
            onChange={() => {}}
            height="100%"
            theme={`vs-${this.state.darkMode ? "dark" : "light"}`}
            defaultLanguage="ifc"
            value={this.state.ifc}
            options={{
              fontSize: this.state.fontSize,
              glyphMargin: true,
              readOnly: true,
              lightbulb: {
                enabled: true,
              },

              editorService: {
                openEditor: function () {
                  alert(`open editor called!` + JSON.stringify(arguments));
                },
                resolveEditor: function () {
                  alert(`resolve editor called!` + JSON.stringify(arguments));
                },
              },
            }}
          />
        </main>
        <Row id="footer">
          <Col xs="auto">{this.state.fileName ? `File: ${this.state.fileName}` : ""}</Col>
          <Col xs="auto">{this.state.schema ? `IFC Schema: ${this.state.schema}` : ""}</Col>
          <Col xs="auto">
            {this.state.fileSize && this.state.fileSize > 0 ? `File Size: ${this.state.fileSize / 1000} KB` : ""}
          </Col>
          <Col xs="auto">
            {this.state.uncompressedSize && this.state.uncompressedSize > 0
              ? `Uncompressed Size: ${this.state.uncompressedSize / 1000} KB`
              : ""}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
