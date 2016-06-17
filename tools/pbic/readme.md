#PowerBI Visuals Compiler 

Takes TS and include chain and prepares for publish as a pbiviz.

##Usage

```
 cd tools\pbic
 npm install -g .\
 cd /path/to/visual/typescript
 pbic tsc
 pbic create --name "myVisual"
 ls *.pbiviz
```

##Todo

* Better package manifest generation
  * User name
  * Support Uri etc
* Manage version numbers automagically
* Distribute Package via npm 
