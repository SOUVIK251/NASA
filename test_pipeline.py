import sys
sys.path.insert(0, 'backend')
from dataset_pipeline import get_all_datasets, load_experiment_timeseries, get_summary_statistics

datasets = get_all_datasets()
print("Datasets loaded:", len(datasets))

ts = load_experiment_timeseries('FLEX-F2-T01')
print("FLEX-F2-T01 rows:", ts['row_count'], "Duration:", ts['duration_s'], "s")

stats = get_summary_statistics('FLEX-F2-T01')
print("Hot flame duration:", stats.get('hot_flame_duration_s'), "s")
print("Cool flame duration:", stats.get('cool_flame_duration_s'), "s")
print("Has cool flame:", stats.get('has_cool_flame'))

ts2 = load_experiment_timeseries('BASS2-PMMA-T01')
print("BASS2-PMMA-T01 rows:", ts2['row_count'], "Duration:", ts2['duration_s'], "s")

ts3 = load_experiment_timeseries('SAFFIRE-I')
print("SAFFIRE-I rows:", ts3['row_count'], "Duration:", ts3['duration_s'], "s")

print("ALL TESTS PASSED")
