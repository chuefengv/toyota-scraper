const puppeteer = require('puppeteer');
const path = require('path');
const pool = require(path.resolve(__dirname, './db.js')); 

const url = 'https://www.toyota.com/venza/2021/';

async function getPage(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
        try{
            await page.setDefaultNavigationTimeout(0);
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
        }catch(err){
            console.log('GETLIST: ' + err.message);
        }
    return page;
}

async function getCarInfo(page){
    await page.reload()

    let carInfo = await page.evaluate(()=>{
        let car = new Object;
        car.name =  document.querySelector("h1[class='mlp-welcome-series']").innerText;
        car.price =  document.querySelector("div[class='mlp-welcome-msrp']>strong").innerText;
        car.mpg =  document.querySelector("div[class='mlp-welcome-mpg']>strong").innerText;
        
        return car;
    })
    return carInfo;
}

async function getCarImages(page){
    await page.reload()

    images = await page.evaluate(()=>{
        //how many color buttons there are
        let amountOfColors = document.querySelectorAll("#wrapper > section:nth-child(5) > div > div.tcom-color-selector-container > div > div.tcom-color-selector-wrapper > div.tcom-sweep > div > div > button").length;
        let carImages = []

        for(let i=0; i<amountOfColors; i++){
            let carImage = new Object;
            //car id foreign key
            carImage.car_id = 26;
            
            //click the button fo color
            document.querySelectorAll("#wrapper > section:nth-child(5) > div.tcom-colorizer-refresh.above-the-fold > div.tcom-color-selector-container > div > div.tcom-color-selector-wrapper > div.tcom-sweep > div > div > button")[`${i}`].click();

            //get color of car
            carImage.color = document.querySelector("#wrapper > section:nth-child(5) > div.tcom-colorizer-refresh.above-the-fold > div.tcom-color-selector-container > div > div.tcom-color-selector-heading > span").innerText;
            
            // get picutre of car
            carImage.link = document.querySelectorAll('div[class="tcom-threesixty-img-container"] > picture > img')[0].src;
        
            carImages[i] = carImage;
        }
        return carImages;
    });

    return images;
}

async function getInfo(){
    let page = await getPage();

    let query1 = 'INSERT INTO cars(name, price, mpg) VALUES($1, $2, $3)';
    let query2 = 'INSERT INTO images(carid, color, link) VALUES($1, $2, $3)';
    let cars = await getCarInfo(page);
    let images = await getCarImages(page);

    try{
        await pool.query(query1, [cars.name, cars.price, cars.mpg]);
    }catch(err){
        console.log(err.message);
    }

    for(let i=0; i<images.length; i++){
        try{
            await pool.query(query2, [images[i].car_id, images[i].color, images[i].link]);
        }catch(err){
            console.log(err.message);
        }
    }

    console.log('done');
}

getInfo();