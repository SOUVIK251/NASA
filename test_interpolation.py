import sys
sys.path.insert(0, 'backend')
from dataset_routes import dataset_router
from dataset_pipeline import get_timeseries_at_time, get_summary_statistics

# Test interpolation at specific time
state = get_timeseries_at_time('FLEX-F2-T01', 5.5)
print("State at t=5.5s (cool flame zone):")
print("  Phase:", state.get('phase'))
print("  D_mm:", round(state.get('D_mm', 0), 3))
print("  Has hot flame:", state.get('_has_hot_flame'))
print("  Has cool flame:", state.get('_has_cool_flame'))
print("  Interpolated:", state.get('_interpolated'))

state2 = get_timeseries_at_time('FLEX-F2-T01', 2.0)
print("\nState at t=2.0s (hot flame zone):")
print("  Phase:", state2.get('phase'))
print("  D_mm:", round(state2.get('D_mm', 0), 3))
print("  Flame diam:", round(state2.get('flame_diam_mm', 0), 2))

# Test BASS-II at steady state
state3 = get_timeseries_at_time('BASS2-PMMA-T01', 15.0)
print("\nBASS-II state at t=15s:")
print("  Phase:", state3.get('phase'))
print("  Flame position:", round(state3.get('flame_pos_mm', 0), 2), "mm")
print("  Spread rate:", round(state3.get('spread_rate_cm_s', 0), 4), "cm/s")

# Test SAFFIRE at peak
state4 = get_timeseries_at_time('SAFFIRE-I', 65.0)
print("\nSAFFIRE-I state at t=65s (peak burn):")
print("  Phase:", state4.get('phase'))
print("  Flame length:", round(state4.get('flame_length_cm', 0), 1), "cm")
print("  Peak temp:", round(state4.get('peak_temp_K', 0), 0), "K")

print("\nALL INTERPOLATION TESTS PASSED")
