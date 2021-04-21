# IfcXplorer

A text reader specifically designed for reading Industry Foundation Class (IFC) files.

I made this program when I was working as a research assistant, working predominantly with IFC files.

Software such as Xbim and Solibri make it easier to view the Geometry, but there are times when you need to navigate the STEP21 files. To an extent Notepad++ makes this job easier. However, to read IFCZip files you have to first convert the file to .zip, then extract the IFC and open it in Notepad++. The primary purpose of this program is to make it easier to read IFCZips and it directly opens up the bytestream.

## Features

This app is built using Monaco Text Editor. This is the same editor used by visual studio code and has many of the same features 

### IFCZIP Reading

Opening IFC zip files in VSCode is not possible without decompressing the file first and opening the contained IFC. This app decompresses the file and pulls the IFC out of the archive and presents the text in the same way as opening a normal IFC. hen 

### Search

This uses the same search as seen in VSCode, which supports Case Match, Word Match and Regex.

![https://i.imgur.com/rWbz01Q.png](https://i.imgur.com/rWbz01Q.png)

### Reference Peek on Hover

One of the key features of this application is the Peek-on-Hover functionality. Since Step21 files work by cross referencing Entities using hashtags, this makes it very difficult to read the files. Hovering over a has tag in this application will display a popup that shows the line being referenced. 

![https://i.imgur.com/OkYU3UI.png](https://i.imgur.com/OkYU3UI.png)



### Goto / Peek Definition

There are various controls to goto/peek a definition (which are linked to hashtags).

| Command                                           | Action           |
| ------------------------------------------------- | ---------------- |
| CTRL + F12  - or - Right Click > Go to Definition | Go to Definition |
| ALT + F12 - or - Right click > Peek Definition    | Peek Definition  |

Go to definition will move the caret to the the entity definition. However, the peek definition from VSCode adds additional value in this application. Peeking the definition on an Entity label reference will show a syntax-highlighted peek at the referenced line for reference. 

![https://i.imgur.com/zvktroW.png](https://i.imgur.com/zvktroW.png)



### Schema Referencing

Another notable feature of this application is the Schema Referencing. This app will detect the Schema when the file is open from the data within the header rows. If the Schema is either: IFC2x3, IFC4 or IFC4X1, the app will provide additional context when hovering over Entity labels. A pop-up will be displayed above Entity labels that shows the Entity label, the schema version and a URL to the schema definition. 

![https://i.imgur.com/BhmBrK7.png](https://i.imgur.com/BhmBrK7.png)



