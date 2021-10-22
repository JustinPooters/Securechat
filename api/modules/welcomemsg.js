function welcomemsg() {

    const str = `
    Welcome to SecureChat
    You are running version: ${version}
    Github: https://github.com/justinpooters
    Twitter: https://twitter.com/justinpooters
    Website: https://justinp.dev
    
    `
    console.log(str);

}

module.exports = {
    load: welcomemsg
}