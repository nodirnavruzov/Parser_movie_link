const puppeteer = require('puppeteer');
const http = require('http');
const port = 8081
require('dotenv').config()


const server = http.createServer(async function (req, res) {
  try {
    const url = req.url;
    if (url === '/movie' && req.method === 'POST') {
      const token = req.headers['x-api-key']
      if (token == process.env.KEY) {
        let data = ''
        req.on('data', (chunk) => {
          data += chunk.toString()
        })
        req.on('end', async () => {
          const movie = await parse(JSON.parse(data))
          const result = filterLinks(movie)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
        })
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: 'Unauthorized. Invalid token' }))
      }
    }
  } catch (error) {
    console.log(error)
    res.end('error')
  }
})




// async function parse(params) {
//   try {
    
//     const browser = await puppeteer.launch()
//     const page = await browser.newPage();
//     await page.setViewport({
//       width: 1920,
//       height: 1080
//   })
//     await page.goto(process.env.URL);
//     await page.waitForSelector('input[name=q]');
//     await page.$eval('input[name=q]', (el, params) => el.value = params.title, params)
//     await page.$eval( 'button[class=b-search__submit]', form => form.click());

//     const allResultsSelector = '.b-content__inline_items';
//     await page.waitForSelector(allResultsSelector);
    
//     const foundMovie = await page.evaluate(async () => {
//       let array = []
//       const elemHref = Array.from(document.querySelectorAll('.b-content__inline_item-link a'))
//       const elemYear = Array.from(document.querySelectorAll('.b-content__inline_item-link div'))

//       for (let i = 0; i < elemHref.length; i++) {
//         const title = elemHref[i];
//         let year = elemYear[i];
//         let splited = year.innerHTML.split(',')
//         year = splited[0].trim()
//         country = splited[1].trim()
//         array.push({
//           title: elemHref[i].innerHTML,
//           year: year.toString(),
//           country: country.toString(),
//           link: title.toString(),
//         })
//       }
//       return array
//     }, );


//     const movieData = {
//       original: {
//         title: params.title,
//         year: params.year,
//         country: params.country
//       },
//       edited: {
//       },
//     }
//     params.title = params.title.split(' ').join('_')
//     movieData.edited = {
//       title: params.title,
//       year: params.year,
//       country: params.country
//     }
//     await browser.close();
//     const result = {
//       foundMovie,
//       params: movieData
//     }
//     return result
//   } catch (error) {
//     console.log(error)
//   }
// }
async function parse(params) {
  const movieData = {
    original: {
      title: params.title,
      year: params.year,
      country: params.country
    },
    edited: {
      title: params.title.split(' ').join('_'),
      year: params.year,
      country: params.country
    }
  };

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(process.env.URL);
    await page.waitForSelector('input[name=q]');
    await page.$eval('input[name=q]', (el, value) => el.value = value, params.title);
    await page.$eval('button[class=b-search__submit]', form => form.click());

    const allResultsSelector = '.b-content__inline_items';
    await page.waitForSelector(allResultsSelector);

    const foundMovie = await page.evaluate(() => {
      const elemHref = Array.from(document.querySelectorAll('.b-content__inline_item-link a'));
      const elemYear = Array.from(document.querySelectorAll('.b-content__inline_item-link div'));

      const array = elemHref.map((title, i) => {
        const [year, country] = elemYear[i].innerHTML.split(',').map(str => str.trim());
        return {
          title: title.innerHTML,
          year: year.toString(),
          country: country.toString(),
          link: title.toString(),
        };
      });

      return array;
    });

    await browser.close();

    const result = {
      foundMovie,
      params: movieData
    };

    return result;
  } catch (error) {
    console.log(error);
  }
}

function filterLinks(data) {
  let foundMovie
  for (let i = 0; i < data.foundMovie.length; i++) {
    const movie = data.foundMovie[i];
    if (movie.title.toLowerCase() === data.params.original.title.toLowerCase()) {
      if (movie.year === data.params.year) {
        return foundMovie = {
          ...movie
        }
      } else if(movie.country.toLowerCase() === data.params.original.country.toLowerCase()){
        return foundMovie = {
          ...movie
        }
      }
    }
  }
  return foundMovie
}



server.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});