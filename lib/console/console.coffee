{Emitter} = require 'atom'
ConsoleView = require './view'

module.exports =
  activate: ->
    @consoleOpener = atom.workspace.addOpener (uri) =>
      if uri == 'atom://console'
        new ConsoleView

    # TODO: eval only in last editor
    @evalCmd = atom.commands.add '.console atom-text-editor',
      'ink:evaluate-in-console': (e) -> e.currentTarget.getModel().inkEval()

  deactivate: ->
    @consoleOpener.dispose()
    @openCmd.dispose()

  console: (view) ->
    view: view
    isInput: false
    input: ->
      @isInput = true
      @view.addItem @view.inputView(this)
    done: ->
      @isInput = false
    out: (s) ->
      @view.addItem @view.outView s
    divider: ->
      @view.divider()
    emitter: new Emitter
    onEval: (f) -> @emitter.on 'eval', f

  openTab: (f) ->
    atom.workspace.open('atom://console', split:'right').then (view) =>
      f @console view

  echo: ->
    @openTab (c) =>
      c.onEval (ed) =>
        c.out ed.getText()
        c.out ed.getText()
        c.divider()
        c.input()
        c.divider()
      c.input()
      c.divider()

  # @echo()