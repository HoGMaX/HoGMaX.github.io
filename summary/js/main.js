class Animator{
    constructor(){
        this.animOn(this.anims);
    }
    animOn(){
        const anims = document.querySelectorAll('.anim');
        if (anims.length > 0){
            window.addEventListener('scroll',animScroll)
            function animScroll(p) {
                for (let i = 0; i < anims.length; i++) {
                    const anim = anims[i];
                    const animHeight = anim.offsetHeight;
                    const animOffSet = offSet(anim).top;
                    const animStart = 3;
        
        
                    let animPoint = window.innerHeight - animHeight / animStart;
                    if (animHeight > window.innerHeight)
                        animPoint = window.innerHeight - window.innerHeight / animStart;
                    if ((pageYOffset > animOffSet - animPoint)&& pageYOffset<(animOffSet + animHeight)){
                        anim.classList.add('_active')
                    }else{
                        if(!anim.classList.contains('atop')){
                            anim.classList.remove('_active')
                        }
                    }
                }
            }
            function offSet(p) {
                const rect = p.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return{top: rect.top + scrollTop, left: rect.left + scrollLeft}
            }
            setTimeout(() => {
                animScroll();
            }, 800);
        }
    }   
}

let anim = new Animator();
anim.animOn();

let html = new SkillBar(
    $selector = '.bar-1',
    sbLabel = 'HTML',
    sbCount = '75'
)
let css = new SkillBar(
    $selector = '.bar-2',
    sbLabel = 'CSS',
    sbCount = '75'
)
let js = new SkillBar(
    $selector = '.bar-3',
    sbLabel = 'JS',
    sbCount = '65'
)
let jquery = new SkillBar(
    $selector = '.bar-4',
    sbLabel = 'JQuary',
    sbCount = '65'
)
let comunication = new SkillBar(
    $selector = '.bar-5',
    sbLabel = 'Comunication',
    sbCount = '65'
)
let teamwork = new SkillBar(
    $selector = '.bar-6',
    sbLabel = 'Teamwork',
    sbCount = '65'
)
let creativity = new SkillBar(
    $selector = '.bar-7',
    sbLabel = 'Creativity',
    sbCount = '50'
)
let attibuteTowork = new SkillBar(
    $selector = '.bar-8',
    sbLabel = 'Attibute to work',
    sbCount = '67'
)
let figma = new SkillBar(
    $selector = '.bar-9',
    sbLabel = 'Figma',
    sbCount = '66'
)
let vsCode = new SkillBar(
    $selector = '.bar-10',
    sbLabel = 'VSCode',
    sbCount = '73'
)
let console = new SkillBar(
    $selector = '.bar-11',
    sbLabel = 'ConsoleDeveloper',
    sbCount = '70'
)
let git = new SkillBar(
    $selector = '.bar-12',
    sbLabel = 'Git',
    sbCount = '75'
)