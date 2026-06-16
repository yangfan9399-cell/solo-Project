import type { PipeStop } from "~/lib/types";

export const PIPE_STOPS: PipeStop[] = [
  { id: "principal-8", name: "Principal 8'", type: "principal", pitch: "8'", octave: 4, rank: 1, description: "主音栓，8英尺音高，管风琴基础音色" },
  { id: "principal-4", name: "Principal 4'", type: "principal", pitch: "4'", octave: 5, rank: 1, description: "主音栓，4英尺音高，高八度" },
  { id: "principal-2", name: "Principal 2'", type: "principal", pitch: "2'", octave: 6, rank: 1, description: "主音栓，2英尺音高，再高八度" },
  { id: "bourdon-16", name: "Bourdon 16'", type: "flute", pitch: "16'", octave: 3, rank: 1, description: "低音笛音栓，16英尺，深厚低音" },
  { id: "flute-8", name: "Flute 8'", type: "flute", pitch: "8'", octave: 4, rank: 1, description: "笛音栓，8英尺，柔和甜美" },
  { id: "flute-4", name: "Flute 4'", type: "flute", pitch: "4'", octave: 5, rank: 1, description: "笛音栓，4英尺，清亮高音" },
  { id: "gedackt-8", name: "Gedackt 8'", type: "flute", pitch: "8'", octave: 4, rank: 1, description: "盖塞笛，8英尺，温润柔和" },
  { id: "salicional-8", name: "Salicional 8'", type: "string", pitch: "8'", octave: 4, rank: 1, description: "弦乐音栓，8英尺，细腻抒情" },
  { id: "violin-4", name: "Violin 4'", type: "string", pitch: "4'", octave: 5, rank: 1, description: "小提琴音栓，4英尺，明亮纤细" },
  { id: "cello-8", name: "Cello 8'", type: "string", pitch: "8'", octave: 4, rank: 1, description: "大提琴音栓，8英尺，温暖浑厚" },
  { id: "oboe-8", name: "Oboe 8'", type: "reed", pitch: "8'", octave: 4, rank: 1, description: "双簧管簧音栓，8英尺，表现力强" },
  { id: "trumpet-8", name: "Trumpet 8'", type: "reed", pitch: "8'", octave: 4, rank: 1, description: "小号簧音栓，8英尺，辉煌明亮" },
  { id: "clarinet-8", name: "Clarinet 8'", type: "reed", pitch: "8'", octave: 4, rank: 1, description: "单簧管簧音栓，8英尺，圆润温暖" },
  { id: "mixture-iii", name: "Mixture III", type: "mixture", pitch: "2 2/3'", octave: 6, rank: 3, description: "混合音栓，三排，增加亮度和共鸣" },
  { id: "mixture-v", name: "Mixture V", type: "mixture", pitch: "2'", octave: 6, rank: 5, description: "混合音栓，五排，宏大辉煌" },
  { id: "tibia-8", name: "Tibia 8'", type: "flute", pitch: "8'", octave: 4, rank: 1, description: "胫管笛，8英尺，剧院管风琴特色" },
];
