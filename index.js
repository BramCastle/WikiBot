const { Telegraf, Format } = require('telegraf');
const { ENVIROMENT, USERS, updateUserSelection } = require('./lib/functions.cjs');
const { getMessages } = require('./lib/fetch.cjs');

const bot = new Telegraf(ENVIROMENT.prod);

bot.start((ctx) =>{ 
    const startMessage = `¡Bienvenid@ ${ctx.from.first_name} ${ctx.from.last_name != undefined ? ctx.from.last_name : ""}!
Selecciona la opcion que deseas `;
    sendStartMessage(ctx, startMessage);
});

function sendStartMessage(ctx, startMessage){

    bot.telegram.sendMessage(ctx.chat.id, startMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "MENSAJES PDF", callback_data: 'mensajes' },
                ],
                [
                    { text: "TOMOS / LIBROS", callback_data: 'TOMOS' },
                ],
                [
                    { text: "AUDIOS", callback_data: 'audios' },
                ]
            ]
        },
    });
}

bot.action('mensajes', (ctx) => {
    // ctx.answerCbQuery();
    const menuMessage = "Buscalo por predicador";
    bot.telegram.sendMessage(ctx.chat.id, menuMessage, {
        reply_markup: {
            keyboard: [
                [
                    { text: "WMB" },
                    { text: "WSS" },
                    { text: "JBP" }
                ],
                [
                    { text: "Salir" }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }
    });
});

bot.action('TOMOS', (ctx) => {
    ctx.answerCbQuery();
    // updateUserSelection(ctx, ctx.update.callback_query.data);
    bot.telegram.sendChatAction(ctx.chat.id, "typing");
    const menuMessage = `Esta opcion esta actualmente en mantenimiento`;
    // const menuMessage = `Haz seleccionado TOMOS, escribe tu busqueda 👇🏻`;
    bot.telegram.sendMessage(ctx.chat.id, menuMessage);
});

bot.action('audios', (ctx) => {
    ctx.answerCbQuery();
    const menuMessage = "AUDIOS estara disponible proximamente.";
    bot.telegram.sendMessage(ctx.chat.id, menuMessage);
});

bot.hears("WMB", (ctx) => {
    updateUserSelection(ctx, ctx.message.text);
    ctx.reply(`Haz seleccionado ${ctx.message.text}, escribe tu busqueda 👇🏻`);
});

bot.hears("JBP", (ctx) => {
    updateUserSelection(ctx, ctx.message.text);
    ctx.reply(`Haz seleccionado ${ctx.message.text}, escribe tu busqueda 👇🏻`);
});

bot.hears("WSS", (ctx) => {
    updateUserSelection(ctx, ctx.message.text);
    ctx.reply(`Haz seleccionado ${ctx.message.text}, escribe tu busqueda 👇🏻`);
});

bot.hears("Salir", (ctx) => {
    bot.telegram.sendMessage(ctx.chat.id, 
        `Selecciona la opcion que deseas ${ctx.from.first_name} 👇🏻` , {
        reply_markup: {
            remove_keyboard: true,
            inline_keyboard: [
                [
                    { text: "MENSAJES PDF", callback_data: 'mensajes' },
                ],
                [
                    { text: "TOMOS / LIBROS", callback_data: 'tomos' },
                ],
                [
                    { text: "AUDIOS", callback_data: 'audios' },
                ]
            ]
        },
    })
});

bot.on('text', async (ctx) => {
    bot.telegram.sendChatAction(ctx.chat.id, "upload_document");
    
    if (ctx.message.text.length <= 2) {
        ctx.reply("Caracteres insuficientes, has una busqueda mas espefica");
        return;
    }

    let objFiles = { hasMessage: false, messages: [] };
    let selection = "";

    selection = USERS.find(x => x.id == ctx.from.id)?.selection;

    if (selection == "" || selection == undefined) {
        ctx.reply("Seleccione una opción");
        return;
    }

    objFiles = await getMessages(ctx, selection);

    console.log(`${ctx.from.first_name} ${ctx.from.last_name != undefined ? ctx.from.last_name : ""}, buscó en ${selection}: '${ctx.message.text}'.`);
    console.log(`Resultado: ${objFiles.messages.length} mensajes.`);
    console.log(`${JSON.stringify(objFiles.messages.map(x => x?.title ))}`);

    await sendFiles(0);
    async function sendFiles(i) {
        Format.fmt
        if (i < objFiles.messages.length) {
            ctx.sendDocument(objFiles.messages[i].path, {
                 caption:  Format.fmt`${Format.bold(objFiles.messages[i].title)}\n${Format.italic(objFiles.messages[i].autor)}\n${Format.italic(objFiles.messages[i].date)}\n${Format.italic(objFiles.messages[i].location)}`
                })
                .then(async () => {
                i++;
                await sendFiles(i);
            }).catch(async () => {
                console.error("Fallo el envio del documento => "+objFiles.messages[i].title);
                objFiles.messages.splice(i, 1);
                await sendFiles(i);
            }).finally(async () =>{
                if(objFiles.messages.length == 0){
                    ctx.reply(`Lo siento, estos archivos son muy grandes para telegram. 😟`);
                }
            });
        }
    }

    if (objFiles.messages.length < 1 && selection != '') {
        ctx.reply(`No encontré coincidencias para "${ctx.message.text}" en ${selection}.`);
    }

});

bot.launch();