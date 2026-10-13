"""Optional paced input. No detector outcome is guaranteed."""
import asyncio
import inspect
import math
import random
import time

def _config(defaults, overrides=None):
    config={'duration_ms':300,'typing_delay_ms':55,'scroll_steps':8,'seed':1,**defaults,**(overrides or {})}
    if set(config)-{'duration_ms','typing_delay_ms','scroll_steps','seed'}:raise ValueError('Unknown human_config key')
    if any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or v<0 for v in config.values()):raise ValueError('Invalid human_config')
    if not isinstance(config['scroll_steps'],int) or not 1<=config['scroll_steps']<=1000 or config['duration_ms']>10000 or config['typing_delay_ms']>5000:raise ValueError('human_config out of bounds')
    return config

def _wrap(original, planner, async_mode):
    if async_mode:
        async def method(*args,**kwargs):
            gen=planner(*args,**kwargs); result=None
            while True:
                try:operation=gen.send(result)
                except StopIteration as done:return done.value
                if operation[0]=='sleep':await asyncio.sleep(operation[1]);result=None
                else:result=await operation[0](*operation[1],**operation[2])
        return method
    def method(*args,**kwargs):
        gen=planner(*args,**kwargs);result=None
        while True:
            try:operation=gen.send(result)
            except StopIteration as done:return done.value
            if operation[0]=='sleep':time.sleep(operation[1]);result=None
            else:result=operation[0](*operation[1],**operation[2])
    return method

def _page(page,defaults):
    if getattr(page,'_custom_humanized',False):return page
    page._custom_humanized=True
    async_mode=inspect.iscoroutinefunction(page.mouse.move)
    position=[0.0,0.0]
    move=page.mouse.move;wheel=page.mouse.wheel;typing=page.keyboard.type;click=page.mouse.click
    def move_plan(x,y,*,human_config=None,**kwargs):
        config=_config(defaults,human_config);start=position[:]
        bend=(random.Random(config['seed']).random()-0.5)*80
        steps=max(1,math.ceil(config['duration_ms']/16))
        for i in range(1,steps+1):
            t=i/steps;u=1-t
            position[0]=u*u*u*start[0]+3*u*u*t*(start[0]+(x-start[0])/3)+3*u*t*t*(start[0]+2*(x-start[0])/3)+t*t*t*x
            position[1]=u*u*u*start[1]+3*u*u*t*(start[1]+(y-start[1])/3+bend)+3*u*t*t*(start[1]+2*(y-start[1])/3-bend)+t*t*t*y
            yield move,tuple(position),kwargs
            yield 'sleep',config['duration_ms']/steps/1000
    def wheel_plan(dx,dy,*,human_config=None):
        config=_config(defaults,human_config)
        for _ in range(config['scroll_steps']):
            yield wheel,(dx/config['scroll_steps'],dy/config['scroll_steps']),{}
            yield 'sleep',config['duration_ms']/config['scroll_steps']/1000
    def type_plan(text,*,human_config=None,**kwargs):
        config=_config(defaults,human_config);rng=random.Random(config['seed'])
        for char in text:
            yield typing,(char,),{**kwargs,'delay':0}
            yield 'sleep',config['typing_delay_ms']*(0.7+0.6*rng.random())/1000
    def click_plan(x,y,*,human_config=None,**kwargs):
        yield page.mouse.move,(x,y),{'human_config':human_config}
        return (yield click,(x,y),kwargs)
    page.mouse.move=_wrap(move,move_plan,async_mode)
    page.mouse.wheel=_wrap(wheel,wheel_plan,async_mode)
    page.mouse.click=_wrap(click,click_plan,async_mode)
    page.keyboard.type=_wrap(typing,type_plan,async_mode)
    def human_click_plan(locator,*,human_config=None,**kwargs):
        deadline=time.monotonic()+kwargs.pop('timeout',30000)/1000
        def remaining():
            value=(deadline-time.monotonic())*1000
            if value<=0:raise TimeoutError('Humanized click timed out')
            return value
        yield locator.click,(),{**kwargs,'trial':True,'timeout':remaining()}
        yield locator.scroll_into_view_if_needed,(),{'timeout':remaining()}
        box=yield locator.bounding_box,(),{}
        if not box:raise RuntimeError('Target lost its bounding box')
        yield page.mouse.move,(box['x']+box['width']/2,box['y']+box['height']/2),{'human_config':human_config}
        return (yield locator.click,(),{**kwargs,'timeout':remaining()})
    def human_type_plan(locator,text,*,human_config=None,timeout=30000):
        yield locator.fill,('',),{'timeout':timeout}
        yield locator.focus,(),{'timeout':timeout}
        yield page.keyboard.type,(text,),{'human_config':human_config}
    page.human_click=_wrap(None,human_click_plan,async_mode)
    page.human_type=_wrap(None,human_type_plan,async_mode)
    return page

def humanize(owner,human_config=None):
    defaults=_config(human_config or {})
    if getattr(owner,'_custom_humanized',False):return owner
    owner._custom_humanized=True
    def context(ctx):
        for page in ctx.pages:_page(page,defaults)
        ctx.on('page',lambda page:_page(page,defaults))
        return ctx
    if hasattr(owner,'contexts'):
        for ctx in owner.contexts:context(ctx)
        native=owner.new_context
        if inspect.iscoroutinefunction(native):
            async def new_context(*a,**k):return context(await native(*a,**k))
        else:
            def new_context(*a,**k):return context(native(*a,**k))
        owner.new_context=new_context
        native_page=owner.new_page
        if inspect.iscoroutinefunction(native_page):
            async def new_page(*a,**k):return _page(await native_page(*a,**k),defaults)
        else:
            def new_page(*a,**k):return _page(native_page(*a,**k),defaults)
        owner.new_page=new_page
    else:context(owner)
    return owner
