class SkillBar {
constructor($selector, sbLabel,sbCount){
        this.$selector = $selector;
        this.sbLabel = sbLabel;
        this.sbCount = sbCount;
        this.setSckillBar(this.$selector, this.sbLabel, this.sbCount);
    }
    setSckillBar ($selector, sbLabel, sbCount){
        //Styles strips status bar
        let sbStyle = [
            "position: relative;"+
            "width: 100%;"+
            "height: 3px;"+
            "background-color: #0a63d0;"+
            "margin: 1vh 0;"
        ];
        //For how many percent is filled with bar status
        let sbStyleBefore = [
            "position: absolute;"+
            "left: 0;"+
            "content: '';"+
            "width:" + sbCount + "%"+";"+
            "height: 3px;"+
            "background-color: #074694;"+
            "z-index: 2;"
        ];
        let styleText = [
            "font-family: 'Muli', sans-serif;"+
            "font-size: 16px;"+
            "font-weight: 300;"+
            "color:#41414a;"
        ]
        let sbSelector = document.querySelector($selector);
        let label = sbSelector.querySelector('.skillbar__label');
        let count = sbSelector.querySelector('.skillbar__count');

        label.style.cssText = styleText;
        count.style.cssText = styleText;
        label.innerHTML = sbLabel;
        count.innerHTML = sbCount + '%';

        let sbBar = sbSelector.querySelector('.skillbar__bar');
        sbBar.setAttribute("style",sbStyle);
        let sbBarBefore = document.createElement('span');
        sbBarBefore.setAttribute("style", sbStyleBefore);
        sbBar.appendChild(sbBarBefore)
    }
}
