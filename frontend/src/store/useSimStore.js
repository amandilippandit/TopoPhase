import { create } from 'zustand'

const useSimStore = create((set, get) => ({
  connected: false,
  running: false,
  params: {
    N: 12,
    T_start: 0.5,
    T_end: 5.0,
    n_temperature_steps: 100,
    sweeps_per_step: 10,
    stream_interval_ms: 200,
    graph_threshold: 0.01,
  },
  snapshots: [],
  currentSnapshot: null,
  topoAlarmStep: null,
  classicalAlarmStep: null,
  leadTime: null,

  setConnected: (val) => set({ connected: val }),
  setRunning: (val) => set({ running: val }),
  setParams: (params) => set({ params }),

  pushSnapshot: (snapshot) => {
    const state = get()
    const newSnapshots = [...state.snapshots, snapshot].slice(-200)
    const updates = {
      snapshots: newSnapshots,
      currentSnapshot: snapshot,
    }

    if (snapshot.topo_alarm_step != null) {
      updates.topoAlarmStep = snapshot.topo_alarm_step
    }
    if (snapshot.classical_alarm_step != null) {
      updates.classicalAlarmStep = snapshot.classical_alarm_step
    }
    if (snapshot.topo_alarm_step != null && snapshot.classical_alarm_step != null) {
      updates.leadTime = snapshot.classical_alarm_step - snapshot.topo_alarm_step
    }
    set(updates)
  },

  resetRun: () =>
    set({
      snapshots: [],
      currentSnapshot: null,
      topoAlarmStep: null,
      classicalAlarmStep: null,
      leadTime: null,
    }),
}))

export default useSimStore
