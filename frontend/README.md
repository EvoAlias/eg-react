<div style="text-align:left;">
  <a href="https://github.com/lidaof/eg-react" target="\_parent"><img src="https://eg.readthedocs.io/en/latest/_images/eg.png" alt="Browser Logo" style="width:300px;"/></a>
</div>

# WashU Epigenome Browser

## CDN

```html
  <!-- CSS -->
  <link rel="stylesheet" href="https://unpkg.com/epgg@latest/umd/epgg.css">

  <!-- JS -->
  <script src="https://unpkg.com/epgg@latest/umd/epgg.js"></script>

  <script>
    renderBrowserInElement(contents, container);
  </script>
```

## Embedding the browser in any HTML file

Create a HTML page with following contents: (the example shows how to embed a mouse browser with 2 bigWig tracks from ENCODE data portal)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta name="theme-color" content="#000000">
  <title>The New WashU Epigenome Browser</title>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
    crossorigin="anonymous">
  <script src="https://igv.org/web/release/2.0.1/dist/igv.min.js"></script>
  <script src="https://igv.org/web/jb/release/1.0.0/dist/juicebox.min.js"></script>
  <script src="https://aframe.io/releases/0.8.0/aframe.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN"
    crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q"
    crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl"
    crossorigin="anonymous"></script>
  <script src="https://unpkg.com/epgg@latest/umd/epgg.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/epgg@latest/umd/epgg.css">
</head>

<body>
  <h1>Embedding test</h1>
  <div id="embed"></div>
  <h2>some other headings</h2>
  <script>
    const container = document.getElementById('embed');
    const contents = { 
        "genomeName": "mm10", 
        displayRegion: "chr5:51997494-52853744",
        "trackLegendWidth": 120, 
        "isShowingNavigator": true,
        "tracks": [
          { 
            "type": "geneannotation", 
            "name": "refGene", 
            "label": "refGene", 
            "options": { "label": "refGene", "maxRows": 6 }, 
            "url": "", 
            "metadata": { "Track type": "geneannotation" } 
          }, 
          { 
            "type": "geneannotation", 
            "name": "gencodeM19Basic", 
            "label": "gencodeM19Basic", 
            "options": { "label": "gencodeM19Basic", "maxRows": 5 }, 
            "url": "", "metadata": { "Track type": "geneannotation" }
          }, 
          { 
            "type": "ruler", 
            "name": "Ruler", "label": "Ruler", 
            "options": { "label": "Ruler" }, 
            "url": "", 
            "metadata": { "Track type": "ruler" } 
          }, 
          { 
            "type": "bigWig", 
            "name": "ChipSeq of Heart", 
            "url": "https://www.encodeproject.org/files/ENCFF641FBI/@@download/ENCFF641FBI.bigWig", 
            "options": { "color": "red" }, 
            "metadata": { "Sample": "Heart" }
          },
          { 
            "type": "bigWig", 
            "name": "ChipSeq of Liver", 
            "url": "https://www.encodeproject.org/files/ENCFF555LBI/@@download/ENCFF555LBI.bigWig", 
            "options": { "color": "blue" }, 
            "metadata": { "Sample": "Liver" }
          }
        ], 
        "metadataTerms": ["Sample"], 
        "regionSets": [], 
        "regionSetViewIndex": -1, 
      };
      renderBrowserInElement(contents, container);
  </script>
</body>
</html>
```

The key API is the function `renderBrowserInElement`, it accepts the `contents` array as first argument,
and `container` as second argument which is a DOM element.

## Start the browser standalone

Download the source code from our github repo: https://github.com/lidaof/eg-react

1. Enter the `frontend` directory
2. `npm install`
3. `npm start`

Your local browser is available at http://localhost:3000/browser/.

## Use your own data API (optional)

Enter the `backend` directory.  `npm install`, and then `npm run setup`.  MongoDB must be installed and running.

## Documentation

Please check all the documentaiton at https://eg.rtfd.io/.