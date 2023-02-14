import {Configuration, OpenAIApi} from 'openai'
const configuration = new Configuration({
    apiKey: ''// your chatgpt apikey
});
const openai = new OpenAIApi(configuration);
export default {
    sendMessage: async function (text) {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: text,
            temperature: 1,
            max_tokens: 2048,
        });
        return response.data.choices[0].text
    },
    sendImage: async function (text) {
        console.log(text, 66666)
        const response = await openai.createImage({
            prompt: text,
            n: 1,
            size: "512x512",
        });
        console.log(response.data)
        return  response.data.data[0].url;
    }
}
