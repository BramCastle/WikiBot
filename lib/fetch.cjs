const cheerio = require('cheerio');
const request = require('request-promise');
const { getNaturalText, removeAccents } = require('./functions.cjs');
const { WIKI_END_POINT, BRANHAM_PAGE_LINK } = require('./consts.cjs');

const getMessages = async (ctx, selection) => {
    let objFiles;
    let lstMessages = [];
    let textSearch = getNaturalText(ctx.message.text);

    lstMessages = await searchMessage(textSearch, selection);

    objFiles = {
        hasMessage: lstMessages.length > 0,
        messages: lstMessages,
    };

    return objFiles;

}

const searchMessage = async (textSearch, selection) => {
    let textTranform = textSearch.split(" ").join("-");
    let indexUID = '';
    switch (selection) {
        case 'JBP':
            indexUID = 'activities';
            break;
        case 'WSS':
            indexUID = 'conferences';
            break;
        default:
            indexUID = 'branham';
            break;
    }

    let lstMessages = [];

    let data = await request({
                    uri: `${WIKI_END_POINT}/api/messages/search/${indexUID}/es/${textTranform}`,
                    json: true
                });

    if(data?.hits != null){
        data?.hits?.forEach(x => {
            if(x == null || x == undefined) return;
            if(x.files?.pdf_simple != undefined && x.files?.pdf_simple != ""){
                lstMessages.push({
                    title:      x.title,
                    path:       x.files?.pdf_simple,
                    autor:      x.autor,
                    location:   x.location,
                    date:       x.date,
                })
            }else if(x.files?.pdf != undefined && x.files?.pdf != ""){
                lstMessages.push({
                    title:      x.title,
                    path:       x.files?.pdf,
                    autor:      x.autor,
                    location:   x.location,
                    date:       x.date,
                })
            }
        });
    }


    return lstMessages;
}

const findBranhamorg = async (textSearch) => {
    console.log(`Buscando en ${BRANHAM_PAGE_LINK}/es/MessageAudio`)
    const $ = await request({
        uri: `${BRANHAM_PAGE_LINK}/es/MessageAudio`,
        transform: body => cheerio.load(body)
    });

    var lstMessages = [];

    $(".large-24 .messagebox").each((i, el) => {

        const textTitle = $(el).find("span.prodtexttitle");
        const pathFile = $(el).find("a[href*='pdf']");

        let naturalTitle = removeAccents(textTitle.text()).toLowerCase();
        if(naturalTitle.includes(textSearch) && pathFile.attr('href') != undefined){
            hasMessage = true;
            lstMessages.push({ 
                title: textTitle.text(), 
                path: pathFile.attr('href'),
                autor: "Rev. William Marrion Branham"
            })
        }
    });

    return lstMessages;
}

const storeMessages = async () => {
    lstMessages = await findBranhamStore();
    // console.log(lstMessages);
    // fs.writeFileSync('messages.json', JSON.stringify(lstMessages));
    var options = {
        method: 'POST',
        uri: `${WIKI_END_POINT}/api/messages/store/branham`,
        body: {},
        json: true,
        timeout: 9900000
    };
    
    await sendFiles(0);

    async function sendFiles(i) {
        options.body = lstMessages[i];
        if (i < lstMessages.length) {
            await request(options)
                .then(async (res) => {
                    i++;
                    await sendFiles(i);
                }).catch(async (e) => {
                    console.log(e)
                    i++;
                    await sendFiles(i);
                })
        }
    }

}

const findBranhamStore = async () => {
    const $ = await request({
        uri: `${BRANHAM_PAGE_LINK}/es/MessageAudio`,
        transform: body => cheerio.load(body)
    });

    var lstMessages = [];

    $(".large-24 .messagebox").each((i, el) => {
        const textTitle = $(el).find("span.prodtexttitle");
        const pathFile = $(el).find("a[href*='pdf']");
        const pathAudio = $(el).find("a[href*='m4a']");
        const code = $(el).find("span.show-for-small-down").text();
        const location = $(el).find("div.large-10 .prodtext2").text();
        let fechaPublicacion = "";

        if(code != "" && !code.includes("TR") && !code.includes("BK")){
            //Sacar fecha de de publicación del siguiente string "SPN 49-1225"
            fechaPublicacion = code.split(" ")[1];
            fechaPublicacion = fechaPublicacion.split("-").reverse().join("");
            
            if(fechaPublicacion.includes("E") 
                || fechaPublicacion.includes("M") 
                || fechaPublicacion.includes("B") 
                || fechaPublicacion.includes("S")
                || fechaPublicacion.includes("A"))
                fechaPublicacion = fechaPublicacion.replace("E", "").replace("M", "").replace("B", "").replace("S", "").replace("A", "");
            
            day = fechaPublicacion.slice(2,4);
            month = fechaPublicacion.slice(0,2);
            year = fechaPublicacion.slice(4,6);

            if(day === "00"){
                day = "01";
            }

            fechaPublicacion = `19${year}-${month}-${day}`

        }

        if(i >= 1){
            hasMessage = true;
            lstMessages.push({ 
                title: textTitle.text(), 
                path: pathFile.attr('href') != undefined ? pathFile.attr('href') : "",
                audio: pathAudio.attr('href') != undefined ? pathAudio.attr('href') : "",
                code: code,
                location: location,
                fechaPublicacion: fechaPublicacion,
                autor: "Rev. William Marrion Branham"
            })
        }
    });

    return lstMessages;
}

module.exports = { getMessages, storeMessages }