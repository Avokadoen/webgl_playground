## WebGL playground 🖼️
This is a little webgl project to learn some basic webgl and have some fun while doing so. :- )

#### current features
- Loading assets (shaders) using rxjs (reactive loading)
- Basic mesh instancing

## Gifs! 👀
- 5\. march 2020

    - [cube rotating](https://i.imgur.com/LlpKd7a)

- 7\. march

    - [mesh instancing](https://i.imgur.com/qNgp9qT)

- 20\. march 
    - [camera controls](https://i.imgur.com/g1pTJ97)

## Prerequisite
You will need [npm](https://www.npmjs.com/get-npm) to install dependencies

## How to run 🚀
clone
```bash
git clone git@github.com:Avokadoen/webgl_playground.git
```

install dependencies
```bash
npm install
```

serve the project using webpack
```bash
npm run start
```

go to localhost:8080 


## Sources 📖
- [Mozilla webgl tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL)
    - This was the main source, and a lot of the code is very much copy paste from this awesome tutorial

- [Pointer locking](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
    - To enable more userfriendly free look camera i use the pointer lock API documented by mozilla 