
const ENVIROMENT = {
    test: "5475108101:AAHyadFROpZ3CXQzAIcqrUIMwfrd8cNYRcY",
    prod: "5685464647:AAFzT7VR25kaVktb4-e6msfHDC_8C8OQ_Ik"
};

var USERS = [
    { id:696227986, first_name:"Abraham", last_name:"Castle", username:"BramCastle", selection:"WMB"}
];

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
} 

const isValidURL = (url) => {
    var regex = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/;
    if(!regex.test(url)) {
        console.log("URL invalida.");
        return false;
    }
    let protocol = url.split(":")[0];
    if(protocol != "https"){
        return false;
    } else {
        return true;
    }
}

const getNaturalText = (textSearch = "") => {
    textSearch = textSearch.split("/").join("")
                            .split("?").join("")
                            .split("¿").join("")
                            .replace("-", " ")
                            .replace(".", "")
                            .replace("_", " ");
    textSearch = removeAccents(textSearch).trim().toLowerCase();
    return textSearch;
}

const updateUserSelection = (ctx, selection) => {

    console.log(`Actualizando archivo seleccion para ${ctx.from.first_name}...`);

    let index = USERS.findIndex(x => x.id == ctx.from.id)

    if(index != undefined && index != -1){
        USERS[index] = {
            id: ctx.from.id,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            username: ctx.from.username,
            selection: selection,
        };
    }else{
        USERS.push({
            id: ctx.from.id,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            username: ctx.from.username,
            selection: selection,
        });
    }

}

module.exports = { removeAccents, isValidURL, getNaturalText, updateUserSelection, ENVIROMENT, USERS }