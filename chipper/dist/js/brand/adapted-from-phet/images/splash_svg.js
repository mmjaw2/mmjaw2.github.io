/* eslint-disable */
import asyncLoader from '../../../phet-core/js/asyncLoader.js';
const image = new Image();
const unlock = asyncLoader.createLock(image);
image.onload = unlock;
image.src = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="273" height="130" viewBox="0 0 273 130"><g fill="#FFF"><path d="M15.88 28.365q-1.674 1.422-3.221 2.008a9.3 9.3 0 0 1-3.321.585q-2.928 0-4.501-1.431-1.573-1.43-1.573-3.655 0-1.305.594-2.385a4.9 4.9 0 0 1 1.556-1.731 7.3 7.3 0 0 1 2.167-.987q.886-.234 2.677-.452 3.648-.435 5.371-1.037.017-.619.017-.786 0-1.841-.853-2.594-1.155-1.02-3.43-1.021-2.125 0-3.137.744-1.012.745-1.498 2.636l-2.945-.401q.401-1.89 1.322-3.054.92-1.163 2.661-1.79 1.74-.628 4.032-.628 2.276 0 3.698.535 1.422.536 2.091 1.348t.937 2.049q.151.77.151 2.778v4.016q0 4.2.192 5.312t.761 2.134h-3.146q-.468-.939-.602-2.193m-.251-6.726q-1.64.669-4.919 1.138-1.857.268-2.627.603t-1.188.979-.418 1.431q0 1.205.912 2.008.911.803 2.668.803 1.74 0 3.095-.761 1.356-.762 1.991-2.083.486-1.021.485-3.012zm19.242 8.918v-2.242q-1.69 2.644-4.969 2.644a6.97 6.97 0 0 1-3.907-1.171q-1.782-1.171-2.761-3.271-.978-2.1-.979-4.827 0-2.66.887-4.827t2.66-3.321 3.966-1.154q1.606 0 2.861.678a6 6 0 0 1 2.042 1.766V6.027h2.995v24.529zm-9.52-8.869q0 3.413 1.439 5.104 1.439 1.69 3.396 1.689 1.974 0 3.355-1.614 1.38-1.614 1.38-4.928 0-3.648-1.406-5.354-1.405-1.708-3.463-1.707-2.008 0-3.354 1.64-1.348 1.64-1.347 5.17m28.645 6.677q-1.674 1.422-3.221 2.008a9.3 9.3 0 0 1-3.321.585q-2.928 0-4.501-1.431-1.573-1.43-1.573-3.655 0-1.305.594-2.385a4.9 4.9 0 0 1 1.556-1.731 7.3 7.3 0 0 1 2.167-.987q.886-.234 2.677-.452 3.648-.435 5.371-1.037.017-.619.017-.786 0-1.841-.853-2.594-1.156-1.02-3.43-1.021-2.125 0-3.137.744-1.012.745-1.498 2.636l-2.945-.401q.401-1.89 1.322-3.054.92-1.163 2.661-1.79 1.74-.628 4.032-.628 2.276 0 3.698.535 1.422.536 2.091 1.348t.937 2.049q.151.77.151 2.778v4.016q0 4.2.192 5.312t.761 2.134h-3.146q-.468-.939-.602-2.193m-.251-6.726q-1.64.669-4.919 1.138-1.857.268-2.627.603t-1.188.979-.418 1.431q0 1.205.912 2.008.911.803 2.668.803 1.74 0 3.095-.761 1.356-.762 1.991-2.083.485-1.021.485-3.012zm7.713 15.727V12.787h2.744v2.31q.97-1.355 2.192-2.033 1.221-.678 2.961-.678 2.275 0 4.016 1.171 1.74 1.172 2.627 3.305t.887 4.677q0 2.727-.979 4.911-.98 2.183-2.845 3.346c-1.865 1.163-2.552 1.163-3.923 1.163q-1.506 0-2.703-.636t-1.966-1.606v8.65zm2.728-15.594q0 3.43 1.389 5.069 1.388 1.64 3.363 1.64 2.009 0 3.438-1.698 1.431-1.698 1.431-5.262 0-3.397-1.397-5.087t-3.338-1.689q-1.924 0-3.405 1.799c-1.481 1.799-1.481 2.942-1.481 5.228m22.905 6.091.435 2.66q-1.272.268-2.275.268-1.64 0-2.543-.519c-.903-.519-1.026-.801-1.271-1.364q-.368-.844-.368-3.556V15.13h-2.208v-2.343h2.208v-4.4l2.995-1.807v6.207h3.028v2.343h-3.028v10.391q0 1.289.159 1.656t.519.586q.36.217 1.029.217a10 10 0 0 0 1.32-.117m15.109-3.029 3.112.385q-.736 2.727-2.728 4.233c-1.992 1.506-3.023 1.506-5.086 1.506q-3.898 0-6.183-2.4-2.284-2.402-2.284-6.735 0-4.484 2.309-6.96t5.99-2.477q3.564 0 5.823 2.426t2.259 6.827q0 .268-.017.803h-13.25q.167 2.928 1.656 4.484t3.714 1.556q1.656 0 2.828-.869 1.172-.87 1.857-2.779m-9.888-4.868h9.922q-.2-2.242-1.138-3.363-1.439-1.74-3.731-1.74-2.074 0-3.489 1.389c-1.415 1.389-1.464 2.163-1.564 3.714m28.31 10.591v-2.242q-1.69 2.644-4.969 2.644a6.97 6.97 0 0 1-3.907-1.171q-1.782-1.171-2.761-3.271t-.979-4.827q0-2.66.887-4.827t2.66-3.321 3.966-1.154q1.606 0 2.861.678a6 6 0 0 1 2.042 1.766V6.027h2.995v24.529zm-9.52-8.869q0 3.413 1.439 5.104 1.438 1.69 3.396 1.689 1.974 0 3.355-1.614 1.38-1.614 1.38-4.928 0-3.648-1.406-5.354-1.405-1.708-3.463-1.707-2.008 0-3.354 1.64-1.348 1.64-1.347 5.17m27.291 8.869V15.13h-2.662v-2.343h2.662v-1.891q-.001-1.79.316-2.66.435-1.17 1.531-1.899 1.095-.728 3.07-.728 1.272 0 2.811.301l-.451 2.627a10 10 0 0 0-1.773-.167q-1.372 0-1.94.586c-.568.586-.567 1.121-.567 2.191v1.64h3.463v2.343h-3.463v15.427zm8.765 0v-17.77h2.711v2.694q1.037-1.892 1.916-2.493a3.35 3.35 0 0 1 1.933-.603q1.524 0 3.095.971l-1.037 2.794q-1.104-.652-2.207-.652-.987 0-1.774.594-.784.594-1.12 1.648-.502 1.606-.502 3.514v9.303zm10.324-8.885q0-4.936 2.744-7.312 2.29-1.974 5.588-1.975 3.663 0 5.99 2.401 2.326 2.4 2.325 6.634-.001 3.43-1.028 5.396a7.3 7.3 0 0 1-2.994 3.054q-1.967 1.087-4.293 1.087-3.73 0-6.031-2.393-2.3-2.39-2.301-6.892m3.096 0q0 3.413 1.488 5.111 1.488 1.699 3.748 1.698 2.24 0 3.731-1.706 1.488-1.707 1.488-5.204 0-3.296-1.498-4.994-1.496-1.698-3.724-1.698-2.258 0-3.748 1.689-1.484 1.69-1.485 5.104m17.083 8.885v-17.77h2.694v2.493a6.34 6.34 0 0 1 2.225-2.1q1.389-.794 3.162-.795 1.975 0 3.238.82t1.781 2.292q2.108-3.112 5.487-3.112 2.644 0 4.065 1.464t1.422 4.51v12.197h-2.994V19.363q0-1.807-.292-2.603c-.195-.529-.552-.956-1.062-1.279q-.772-.485-1.809-.485-1.873 0-3.112 1.246-1.237 1.246-1.237 3.991v10.323h-3.013V19.012q0-2.008-.735-3.012c-.735-1.004-1.295-1.004-2.409-1.004q-1.273 0-2.351.669-1.081.67-1.564 1.958-.486 1.288-.485 3.714v9.22zM46.126 70.023c0 4.498-3.525 8.76-9.58 8.76H24.07V61.266h12.476c6.054 0 9.58 4.255 9.58 8.757m22.056 0c0-14.241-10.711-27.866-30.621-27.866H2.025v86.641h22.046V97.893h13.493c19.907 0 30.618-13.633 30.618-27.87m137.138 58.782h-60.99V42.158h126.645v18.987h-22.047v67.66h-22.055v-67.66h-60.494v14.48h33.267v18.986h-33.267v15.212h38.941zm-82.605-62.924c-12.096-5.899-25.902-.322-25.902-.322V42.161H72.831v86.644h23.473v-33.07h.038a9 9 0 0 1-.038-.739c0-5.421 4.396-9.824 9.819-9.824 5.416 0 9.816 4.402 9.816 9.824 0 .248-.017.498-.038.739h.038v33.07h21.87v-31.72c-.002-12.39-.799-24.233-15.094-31.204"/><path d="M255.436 128.85v-8.848h-3.303v-1.182h7.951v1.182h-3.32v8.848zm5.968 0v-10.03h1.998l2.373 7.1q.329.992.479 1.485c.113-.365.293-.9.531-1.607l2.404-6.978h1.785v10.029h-1.281v-8.395l-2.914 8.395h-1.193l-2.902-8.539v8.539h-1.28z"/></g></svg>')}`;
export default image;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0xvYWRlciIsImltYWdlIiwiSW1hZ2UiLCJ1bmxvY2siLCJjcmVhdGVMb2NrIiwib25sb2FkIiwic3JjIiwiYnRvYSJdLCJzb3VyY2VzIjpbInNwbGFzaF9zdmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IGFzeW5jTG9hZGVyIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9hc3luY0xvYWRlci5qcyc7XHJcblxyXG5jb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5jb25zdCB1bmxvY2sgPSBhc3luY0xvYWRlci5jcmVhdGVMb2NrKCBpbWFnZSApO1xyXG5pbWFnZS5vbmxvYWQgPSB1bmxvY2s7XHJcbmltYWdlLnNyYyA9IGBkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCR7YnRvYSgnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIiB3aWR0aD1cIjI3M1wiIGhlaWdodD1cIjEzMFwiIHZpZXdCb3g9XCIwIDAgMjczIDEzMFwiPjxnIGZpbGw9XCIjRkZGXCI+PHBhdGggZD1cIk0xNS44OCAyOC4zNjVxLTEuNjc0IDEuNDIyLTMuMjIxIDIuMDA4YTkuMyA5LjMgMCAwIDEtMy4zMjEuNTg1cS0yLjkyOCAwLTQuNTAxLTEuNDMxLTEuNTczLTEuNDMtMS41NzMtMy42NTUgMC0xLjMwNS41OTQtMi4zODVhNC45IDQuOSAwIDAgMSAxLjU1Ni0xLjczMSA3LjMgNy4zIDAgMCAxIDIuMTY3LS45ODdxLjg4Ni0uMjM0IDIuNjc3LS40NTIgMy42NDgtLjQzNSA1LjM3MS0xLjAzNy4wMTctLjYxOS4wMTctLjc4NiAwLTEuODQxLS44NTMtMi41OTQtMS4xNTUtMS4wMi0zLjQzLTEuMDIxLTIuMTI1IDAtMy4xMzcuNzQ0LTEuMDEyLjc0NS0xLjQ5OCAyLjYzNmwtMi45NDUtLjQwMXEuNDAxLTEuODkgMS4zMjItMy4wNTQuOTItMS4xNjMgMi42NjEtMS43OSAxLjc0LS42MjggNC4wMzItLjYyOCAyLjI3NiAwIDMuNjk4LjUzNSAxLjQyMi41MzYgMi4wOTEgMS4zNDh0LjkzNyAyLjA0OXEuMTUxLjc3LjE1MSAyLjc3OHY0LjAxNnEwIDQuMi4xOTIgNS4zMTJ0Ljc2MSAyLjEzNGgtMy4xNDZxLS40NjgtLjkzOS0uNjAyLTIuMTkzbS0uMjUxLTYuNzI2cS0xLjY0LjY2OS00LjkxOSAxLjEzOC0xLjg1Ny4yNjgtMi42MjcuNjAzdC0xLjE4OC45NzktLjQxOCAxLjQzMXEwIDEuMjA1LjkxMiAyLjAwOC45MTEuODAzIDIuNjY4LjgwMyAxLjc0IDAgMy4wOTUtLjc2MSAxLjM1Ni0uNzYyIDEuOTkxLTIuMDgzLjQ4Ni0xLjAyMS40ODUtMy4wMTJ6bTE5LjI0MiA4LjkxOHYtMi4yNDJxLTEuNjkgMi42NDQtNC45NjkgMi42NDRhNi45NyA2Ljk3IDAgMCAxLTMuOTA3LTEuMTcxcS0xLjc4Mi0xLjE3MS0yLjc2MS0zLjI3MS0uOTc4LTIuMS0uOTc5LTQuODI3IDAtMi42Ni44ODctNC44Mjd0Mi42Ni0zLjMyMSAzLjk2Ni0xLjE1NHExLjYwNiAwIDIuODYxLjY3OGE2IDYgMCAwIDEgMi4wNDIgMS43NjZWNi4wMjdoMi45OTV2MjQuNTI5em0tOS41Mi04Ljg2OXEwIDMuNDEzIDEuNDM5IDUuMTA0IDEuNDM5IDEuNjkgMy4zOTYgMS42ODkgMS45NzQgMCAzLjM1NS0xLjYxNCAxLjM4LTEuNjE0IDEuMzgtNC45MjggMC0zLjY0OC0xLjQwNi01LjM1NC0xLjQwNS0xLjcwOC0zLjQ2My0xLjcwNy0yLjAwOCAwLTMuMzU0IDEuNjQtMS4zNDggMS42NC0xLjM0NyA1LjE3bTI4LjY0NSA2LjY3N3EtMS42NzQgMS40MjItMy4yMjEgMi4wMDhhOS4zIDkuMyAwIDAgMS0zLjMyMS41ODVxLTIuOTI4IDAtNC41MDEtMS40MzEtMS41NzMtMS40My0xLjU3My0zLjY1NSAwLTEuMzA1LjU5NC0yLjM4NWE0LjkgNC45IDAgMCAxIDEuNTU2LTEuNzMxIDcuMyA3LjMgMCAwIDEgMi4xNjctLjk4N3EuODg2LS4yMzQgMi42NzctLjQ1MiAzLjY0OC0uNDM1IDUuMzcxLTEuMDM3LjAxNy0uNjE5LjAxNy0uNzg2IDAtMS44NDEtLjg1My0yLjU5NC0xLjE1Ni0xLjAyLTMuNDMtMS4wMjEtMi4xMjUgMC0zLjEzNy43NDQtMS4wMTIuNzQ1LTEuNDk4IDIuNjM2bC0yLjk0NS0uNDAxcS40MDEtMS44OSAxLjMyMi0zLjA1NC45Mi0xLjE2MyAyLjY2MS0xLjc5IDEuNzQtLjYyOCA0LjAzMi0uNjI4IDIuMjc2IDAgMy42OTguNTM1IDEuNDIyLjUzNiAyLjA5MSAxLjM0OHQuOTM3IDIuMDQ5cS4xNTEuNzcuMTUxIDIuNzc4djQuMDE2cTAgNC4yLjE5MiA1LjMxMnQuNzYxIDIuMTM0aC0zLjE0NnEtLjQ2OC0uOTM5LS42MDItMi4xOTNtLS4yNTEtNi43MjZxLTEuNjQuNjY5LTQuOTE5IDEuMTM4LTEuODU3LjI2OC0yLjYyNy42MDN0LTEuMTg4Ljk3OS0uNDE4IDEuNDMxcTAgMS4yMDUuOTEyIDIuMDA4LjkxMS44MDMgMi42NjguODAzIDEuNzQgMCAzLjA5NS0uNzYxIDEuMzU2LS43NjIgMS45OTEtMi4wODMuNDg1LTEuMDIxLjQ4NS0zLjAxMnptNy43MTMgMTUuNzI3VjEyLjc4N2gyLjc0NHYyLjMxcS45Ny0xLjM1NSAyLjE5Mi0yLjAzMyAxLjIyMS0uNjc4IDIuOTYxLS42NzggMi4yNzUgMCA0LjAxNiAxLjE3MSAxLjc0IDEuMTcyIDIuNjI3IDMuMzA1dC44ODcgNC42NzdxMCAyLjcyNy0uOTc5IDQuOTExLS45OCAyLjE4My0yLjg0NSAzLjM0NmMtMS44NjUgMS4xNjMtMi41NTIgMS4xNjMtMy45MjMgMS4xNjNxLTEuNTA2IDAtMi43MDMtLjYzNnQtMS45NjYtMS42MDZ2OC42NXptMi43MjgtMTUuNTk0cTAgMy40MyAxLjM4OSA1LjA2OSAxLjM4OCAxLjY0IDMuMzYzIDEuNjQgMi4wMDkgMCAzLjQzOC0xLjY5OCAxLjQzMS0xLjY5OCAxLjQzMS01LjI2MiAwLTMuMzk3LTEuMzk3LTUuMDg3dC0zLjMzOC0xLjY4OXEtMS45MjQgMC0zLjQwNSAxLjc5OWMtMS40ODEgMS43OTktMS40ODEgMi45NDItMS40ODEgNS4yMjhtMjIuOTA1IDYuMDkxLjQzNSAyLjY2cS0xLjI3Mi4yNjgtMi4yNzUuMjY4LTEuNjQgMC0yLjU0My0uNTE5Yy0uOTAzLS41MTktMS4wMjYtLjgwMS0xLjI3MS0xLjM2NHEtLjM2OC0uODQ0LS4zNjgtMy41NTZWMTUuMTNoLTIuMjA4di0yLjM0M2gyLjIwOHYtNC40bDIuOTk1LTEuODA3djYuMjA3aDMuMDI4djIuMzQzaC0zLjAyOHYxMC4zOTFxMCAxLjI4OS4xNTkgMS42NTZ0LjUxOS41ODZxLjM2LjIxNyAxLjAyOS4yMTdhMTAgMTAgMCAwIDAgMS4zMi0uMTE3bTE1LjEwOS0zLjAyOSAzLjExMi4zODVxLS43MzYgMi43MjctMi43MjggNC4yMzNjLTEuOTkyIDEuNTA2LTMuMDIzIDEuNTA2LTUuMDg2IDEuNTA2cS0zLjg5OCAwLTYuMTgzLTIuNC0yLjI4NC0yLjQwMi0yLjI4NC02LjczNSAwLTQuNDg0IDIuMzA5LTYuOTZ0NS45OS0yLjQ3N3EzLjU2NCAwIDUuODIzIDIuNDI2dDIuMjU5IDYuODI3cTAgLjI2OC0uMDE3LjgwM2gtMTMuMjVxLjE2NyAyLjkyOCAxLjY1NiA0LjQ4NHQzLjcxNCAxLjU1NnExLjY1NiAwIDIuODI4LS44NjkgMS4xNzItLjg3IDEuODU3LTIuNzc5bS05Ljg4OC00Ljg2OGg5LjkyMnEtLjItMi4yNDItMS4xMzgtMy4zNjMtMS40MzktMS43NC0zLjczMS0xLjc0LTIuMDc0IDAtMy40ODkgMS4zODljLTEuNDE1IDEuMzg5LTEuNDY0IDIuMTYzLTEuNTY0IDMuNzE0bTI4LjMxIDEwLjU5MXYtMi4yNDJxLTEuNjkgMi42NDQtNC45NjkgMi42NDRhNi45NyA2Ljk3IDAgMCAxLTMuOTA3LTEuMTcxcS0xLjc4Mi0xLjE3MS0yLjc2MS0zLjI3MXQtLjk3OS00LjgyN3EwLTIuNjYuODg3LTQuODI3dDIuNjYtMy4zMjEgMy45NjYtMS4xNTRxMS42MDYgMCAyLjg2MS42NzhhNiA2IDAgMCAxIDIuMDQyIDEuNzY2VjYuMDI3aDIuOTk1djI0LjUyOXptLTkuNTItOC44NjlxMCAzLjQxMyAxLjQzOSA1LjEwNCAxLjQzOCAxLjY5IDMuMzk2IDEuNjg5IDEuOTc0IDAgMy4zNTUtMS42MTQgMS4zOC0xLjYxNCAxLjM4LTQuOTI4IDAtMy42NDgtMS40MDYtNS4zNTQtMS40MDUtMS43MDgtMy40NjMtMS43MDctMi4wMDggMC0zLjM1NCAxLjY0LTEuMzQ4IDEuNjQtMS4zNDcgNS4xN20yNy4yOTEgOC44NjlWMTUuMTNoLTIuNjYydi0yLjM0M2gyLjY2MnYtMS44OTFxLS4wMDEtMS43OS4zMTYtMi42Ni40MzUtMS4xNyAxLjUzMS0xLjg5OSAxLjA5NS0uNzI4IDMuMDctLjcyOCAxLjI3MiAwIDIuODExLjMwMWwtLjQ1MSAyLjYyN2ExMCAxMCAwIDAgMC0xLjc3My0uMTY3cS0xLjM3MiAwLTEuOTQuNTg2Yy0uNTY4LjU4Ni0uNTY3IDEuMTIxLS41NjcgMi4xOTF2MS42NGgzLjQ2M3YyLjM0M2gtMy40NjN2MTUuNDI3em04Ljc2NSAwdi0xNy43N2gyLjcxMXYyLjY5NHExLjAzNy0xLjg5MiAxLjkxNi0yLjQ5M2EzLjM1IDMuMzUgMCAwIDEgMS45MzMtLjYwM3ExLjUyNCAwIDMuMDk1Ljk3MWwtMS4wMzcgMi43OTRxLTEuMTA0LS42NTItMi4yMDctLjY1Mi0uOTg3IDAtMS43NzQuNTk0LS43ODQuNTk0LTEuMTIgMS42NDgtLjUwMiAxLjYwNi0uNTAyIDMuNTE0djkuMzAzem0xMC4zMjQtOC44ODVxMC00LjkzNiAyLjc0NC03LjMxMiAyLjI5LTEuOTc0IDUuNTg4LTEuOTc1IDMuNjYzIDAgNS45OSAyLjQwMSAyLjMyNiAyLjQgMi4zMjUgNi42MzQtLjAwMSAzLjQzLTEuMDI4IDUuMzk2YTcuMyA3LjMgMCAwIDEtMi45OTQgMy4wNTRxLTEuOTY3IDEuMDg3LTQuMjkzIDEuMDg3LTMuNzMgMC02LjAzMS0yLjM5My0yLjMtMi4zOS0yLjMwMS02Ljg5Mm0zLjA5NiAwcTAgMy40MTMgMS40ODggNS4xMTEgMS40ODggMS42OTkgMy43NDggMS42OTggMi4yNCAwIDMuNzMxLTEuNzA2IDEuNDg4LTEuNzA3IDEuNDg4LTUuMjA0IDAtMy4yOTYtMS40OTgtNC45OTQtMS40OTYtMS42OTgtMy43MjQtMS42OTgtMi4yNTggMC0zLjc0OCAxLjY4OS0xLjQ4NCAxLjY5LTEuNDg1IDUuMTA0bTE3LjA4MyA4Ljg4NXYtMTcuNzdoMi42OTR2Mi40OTNhNi4zNCA2LjM0IDAgMCAxIDIuMjI1LTIuMXExLjM4OS0uNzk0IDMuMTYyLS43OTUgMS45NzUgMCAzLjIzOC44MnQxLjc4MSAyLjI5MnEyLjEwOC0zLjExMiA1LjQ4Ny0zLjExMiAyLjY0NCAwIDQuMDY1IDEuNDY0dDEuNDIyIDQuNTF2MTIuMTk3aC0yLjk5NFYxOS4zNjNxMC0xLjgwNy0uMjkyLTIuNjAzYy0uMTk1LS41MjktLjU1Mi0uOTU2LTEuMDYyLTEuMjc5cS0uNzcyLS40ODUtMS44MDktLjQ4NS0xLjg3MyAwLTMuMTEyIDEuMjQ2LTEuMjM3IDEuMjQ2LTEuMjM3IDMuOTkxdjEwLjMyM2gtMy4wMTNWMTkuMDEycTAtMi4wMDgtLjczNS0zLjAxMmMtLjczNS0xLjAwNC0xLjI5NS0xLjAwNC0yLjQwOS0xLjAwNHEtMS4yNzMgMC0yLjM1MS42NjktMS4wODEuNjctMS41NjQgMS45NTgtLjQ4NiAxLjI4OC0uNDg1IDMuNzE0djkuMjJ6TTQ2LjEyNiA3MC4wMjNjMCA0LjQ5OC0zLjUyNSA4Ljc2LTkuNTggOC43NkgyNC4wN1Y2MS4yNjZoMTIuNDc2YzYuMDU0IDAgOS41OCA0LjI1NSA5LjU4IDguNzU3bTIyLjA1NiAwYzAtMTQuMjQxLTEwLjcxMS0yNy44NjYtMzAuNjIxLTI3Ljg2NkgyLjAyNXY4Ni42NDFoMjIuMDQ2Vjk3Ljg5M2gxMy40OTNjMTkuOTA3IDAgMzAuNjE4LTEzLjYzMyAzMC42MTgtMjcuODdtMTM3LjEzOCA1OC43ODJoLTYwLjk5VjQyLjE1OGgxMjYuNjQ1djE4Ljk4N2gtMjIuMDQ3djY3LjY2aC0yMi4wNTV2LTY3LjY2aC02MC40OTR2MTQuNDhoMzMuMjY3djE4Ljk4NmgtMzMuMjY3djE1LjIxMmgzOC45NDF6bS04Mi42MDUtNjIuOTI0Yy0xMi4wOTYtNS44OTktMjUuOTAyLS4zMjItMjUuOTAyLS4zMjJWNDIuMTYxSDcyLjgzMXY4Ni42NDRoMjMuNDczdi0zMy4wN2guMDM4YTkgOSAwIDAgMS0uMDM4LS43MzljMC01LjQyMSA0LjM5Ni05LjgyNCA5LjgxOS05LjgyNCA1LjQxNiAwIDkuODE2IDQuNDAyIDkuODE2IDkuODI0IDAgLjI0OC0uMDE3LjQ5OC0uMDM4LjczOWguMDM4djMzLjA3aDIxLjg3di0zMS43MmMtLjAwMi0xMi4zOS0uNzk5LTI0LjIzMy0xNS4wOTQtMzEuMjA0XCIvPjxwYXRoIGQ9XCJNMjU1LjQzNiAxMjguODV2LTguODQ4aC0zLjMwM3YtMS4xODJoNy45NTF2MS4xODJoLTMuMzJ2OC44NDh6bTUuOTY4IDB2LTEwLjAzaDEuOTk4bDIuMzczIDcuMXEuMzI5Ljk5Mi40NzkgMS40ODVjLjExMy0uMzY1LjI5My0uOS41MzEtMS42MDdsMi40MDQtNi45NzhoMS43ODV2MTAuMDI5aC0xLjI4MXYtOC4zOTVsLTIuOTE0IDguMzk1aC0xLjE5M2wtMi45MDItOC41Mzl2OC41MzloLTEuMjh6XCIvPjwvZz48L3N2Zz4nKX1gO1xyXG5leHBvcnQgZGVmYXVsdCBpbWFnZTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0EsT0FBT0EsV0FBVyxNQUFNLHNDQUFzQztBQUU5RCxNQUFNQyxLQUFLLEdBQUcsSUFBSUMsS0FBSyxDQUFDLENBQUM7QUFDekIsTUFBTUMsTUFBTSxHQUFHSCxXQUFXLENBQUNJLFVBQVUsQ0FBRUgsS0FBTSxDQUFDO0FBQzlDQSxLQUFLLENBQUNJLE1BQU0sR0FBR0YsTUFBTTtBQUNyQkYsS0FBSyxDQUFDSyxHQUFHLEdBQUksNkJBQTRCQyxJQUFJLENBQUMsMjZLQUEyNkssQ0FBRSxFQUFDO0FBQzU5SyxlQUFlTixLQUFLIiwiaWdub3JlTGlzdCI6W119