# Western Balkans R+I

The app can be viewed online [here](http://juanfelipegomez.com/balkans/).

This assigment was done using [this](https://observablehq.com/@jfcali/exploration) Observable notebook as a quick-and-dirty data exploration tool, as well as a Tableau file found in `/assets`.

For the notebook to display correctly, both `activities.csv` and `participations.csv` have to be uploaded to the book, using both inputs found at the top.

# Running the app

To view locally you will need to have `npm` installed. Use `npm run serve` to set up a local server on port `5000` which serves files found in '/dist'. This will allow you to navigate to `localhost:5000` and view the app.

Alternatively you can run `npm install` followed by `npm start` to set up a local development server. This will use source files found in '/src'.

# Big to-dos:

- More data cleaning. It seemed some organizations could be repeated or could be categorized into one.
- Take into account 'Patents'.
- Refactor data loading in order to maximize performance.
- Overall styles, design and interaction can be heavily improved
- Responsiveness
