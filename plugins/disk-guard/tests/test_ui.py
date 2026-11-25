#!/usr/bin/env python3
"""Render real plugin controls with a mock popup host; does not touch the desktop."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time

ROOT=Path(__file__).resolve().parents[1]
SHELL=Path('/usr/share/omarchy/shell')

STUB='''import QtQuick
Item {
    required property Item anchorItem
    required property QtObject bar
    property var owner
    property bool open: false
    property int contentWidth: 740
    property int contentHeight: 780
    property Item focusTarget
    default property alias body: holder.data
    function fittedContentWidth(w) { return Math.min(740,w) }
    function fittedContentHeight(h) { return Math.min(780,h) }
    x: 10; y: 50; width: contentWidth; height: contentHeight; visible: open
    Rectangle { anchors.fill: parent; color: "#101315"; border.color: "#40474c" }
    Item { id: holder; anchors.fill: parent; anchors.margins: 16 }
}'''
HARNESS='''import QtQuick
import QtQuick.Window
import Quickshell
import "Plugin" as Disk
ShellRoot {
    QtObject {
        id: fakeBar
        property string position: "top"
        property bool vertical: false
        property int barSize: 32
        property color barForeground: "#e8e8e8"
        property color urgent: "#dc6060"
        property string fontFamily: "sans-serif"
        property bool foregroundAnimationEnabled: false
        property var activePopout: null
        property var clickTargets: []
        function hideTooltip(item) {}
        function showTooltip(item,text) {}
        function registerClickTarget(item) {}
        function unregisterClickTarget(item) {}
        function requestPopout(item) { activePopout=item }
        function releasePopout(item) { if(activePopout===item)activePopout=null }
        function targetBelongsToWindow(item,window) { return false }
    }
    Window {
        id: host
        width: 900; height: 900; visible: true; color: "#101315"
        Component.onCompleted: contentItem.layer.enabled = true
        Disk.Panel {
            id: plugin
            bar: fakeBar; initialized: true; manageIpc: false
            helper: decodeURIComponent(Qt.resolvedUrl("fixture.py").toString().replace("file://",""))
        }
    }
    Timer { interval: 700; running: true; onTriggered: { plugin.open(); console.log("UI_READY") } }
    Timer {
        interval: 1200; running: true
        onTriggered: {
            var mode=Quickshell.env("DISK_GUARD_TEST_MODE")
            if(mode==="review") {plugin.chosen=["one"];plugin.request(["preview","one"])}
            if(mode==="trash") plugin.mode="trash"
        }
    }
    Timer {
        interval: 2100; running: true
        onTriggered: host.contentItem.grabToImage(function(result) {
            result.saveToFile(Quickshell.env("DISK_GUARD_TEST_OUTPUT")); console.log("UI_RENDERED")
        })
    }
    Timer { interval: 2800; running: true; onTriggered: Qt.quit() }
}'''


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'test-results')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    if not shutil.which('quickshell') or not SHELL.exists():raise SystemExit('Needs installed Omarchy and Quickshell')
    entries=[
        {'id':'one','name':'Unbird / target','path':'/home/example/github/unbird/target','risk':'safe','category':'Projects','description':'Compiled Rust objects. Rebuild with cargo build.','kind':'project','age_days':12,'bytes':24*1024**3,'blocked':'','note':''},
        {'id':'two','name':'UV packages','path':'/home/example/.cache/uv','risk':'safe','category':'Python','description':'Downloaded Python packages; uv downloads them again.','kind':'cache','age_days':18,'bytes':20*1024**3,'blocked':'','note':''},
        {'id':'three','name':'large-recording.mp4','path':'/home/example/Downloads/large-recording.mp4','risk':'risky','category':'Downloads','description':'Large file, not necessarily disposable. Review its contents and purpose.','kind':'file','age_days':40,'bytes':3*1024**3,'blocked':'','note':''}]
    sample={'entries':entries,'disks':[{'percent':76,'available':164*1024**3,'used':518*1024**3,'total':682*1024**3,'mount':'/','source':'/dev/mapper/omarchy_root'}],
            'trash':[{'id':'disk-guard-example','name':'disk-guard-example','original':'/home/example/.cache/uv','bytes':20*1024**3,'status':'trashed'}],
            'categories':{'Projects':24*1024**3,'Python':20*1024**3,'Downloads':3*1024**3},'review_bytes':47*1024**3,
            'safe_stale_bytes':44*1024**3,'trash_bytes':20*1024**3,'scanned_at':time.time(),'complete':True,'errors':[],'forecasts':{}}
    preview={'entries':[entries[0]],'blocked':{},'bytes':entries[0]['bytes'],'phrase':'MOVE TO TRASH','token':'test-token',
             'message':'Moving to Trash is recoverable and does not free disk space. Review every selected path.'}
    with tempfile.TemporaryDirectory(prefix='disk-guard-ui-') as directory:
        tmp=Path(directory)
        shutil.copytree(SHELL/'Commons',tmp/'Commons')
        shutil.copytree(SHELL/'Ui',tmp/'Ui')
        (tmp/'Ui/KeyboardPanel.qml').write_text(STUB)
        (tmp/'Plugin').mkdir();shutil.copy2(ROOT/'Panel.qml',tmp/'Plugin/Panel.qml')
        (tmp/'shell.qml').write_text(HARNESS)
        (tmp/'fixture.py').write_text('import json,sys\nprint(json.dumps('+repr(preview)+' if sys.argv[1]=="preview" else '+repr(sample)+'))\n')
        runtime=tmp/'runtime';runtime.mkdir(mode=0o700)
        for mode in ['files','review','trash']:
            output=(args.output/(mode+'.png')).resolve()
            env={**os.environ,'QT_QUICK_BACKEND':'software','QT_QPA_PLATFORM':'offscreen',
                 'QT_QPA_PLATFORMTHEME':'basic','QT_QUICK_CONTROLS_STYLE':'Basic',
                 'XDG_RUNTIME_DIR':str(runtime),'XDG_STATE_HOME':str(tmp/'state'),
                 'XDG_CONFIG_HOME':str(tmp/'config'),'DISK_GUARD_TEST_MODE':mode,
                 'DISK_GUARD_TEST_OUTPUT':str(output)}
            run=subprocess.run(['quickshell','--no-color','-p',str(tmp/'shell.qml')],env=env,capture_output=True,text=True,timeout=15)
            log=run.stdout+run.stderr
            (args.output/(mode+'.log')).write_text(log)
            bad=['Failed to load configuration','TypeError','ReferenceError','Unable to assign','Binding loop']
            if run.returncode or any(x in log for x in bad) or 'UI_RENDERED' not in log or not output.exists():
                raise SystemExit(mode+' UI failed:\n'+log)
            print(mode+': rendered without QML binding errors')

if __name__=='__main__':main()
