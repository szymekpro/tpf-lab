import csv
import math
import random
from datetime import datetime, timedelta

def meal_curve(hours_since, amplitude, rise=0.45, decay=2.6):
    if hours_since < 0:
        return 0
    up = 1 - math.exp(-hours_since / rise)
    down = math.exp(-hours_since / decay)
    return amplitude * up * down

def generate_cgm_data(days=30, interval_min=5, filename="../public/cgm-data.csv"):
    total_steps = days * 24 * 60 // interval_min
    
    end_time = datetime.now().replace(second=0, microsecond=0)
    end_time -= timedelta(minutes=end_time.minute % interval_min)
    start_time = end_time - timedelta(minutes=total_steps * interval_min)

    rows = [["timestamp", "glucose_mg_dl"]]
    glucose = 115.0

    day_biases = [random.gauss(0, 15) for _ in range(days + 2)]
    
    unplanned_offset = 0.0

    steps_per_day = 24 * 60 // interval_min
    last_24h_start = total_steps - steps_per_day

    while True:
        forced_low_start = random.randint(last_24h_start + 12, total_steps - 20)
        forced_high_start = random.randint(last_24h_start + 12, total_steps - 20)
        if abs(forced_low_start - forced_high_start) > 24:
            break

    for i in range(total_steps):
        current_time = start_time + timedelta(minutes=i * interval_min)
        hour = current_time.hour + current_time.minute / 60.0
        day_index = i // (24 * 60 // interval_min)

        base = 110 + day_biases[day_index]
        dawn = 20 * math.exp(-((hour - 6.5) ** 2) / 3.0)

        breakfast = meal_curve(hour - (7.5 + random.gauss(0, 0.3)), random.gauss(90, 25))
        lunch = meal_curve(hour - (13.0 + random.gauss(0, 0.3)), random.gauss(80, 20))
        dinner = meal_curve(hour - (19.0 + random.gauss(0, 0.3)), random.gauss(85, 25))

        unplanned_offset *= 0.96

        if forced_low_start <= i < forced_low_start + 8:
            unplanned_offset = -80
            
        elif forced_high_start <= i < forced_high_start + 11:
            unplanned_offset = 160
            
        elif random.random() < 0.005:
            unplanned_offset += random.gauss(80, 25)
        elif random.random() < 0.004:
            unplanned_offset -= random.gauss(75, 20)

        target = base + dawn + breakfast + lunch + dinner + unplanned_offset
        glucose += 0.25 * (target - glucose) + random.gauss(0, 3.5)
        value = max(40, min(400, round(glucose)))

        timestamp_str = current_time.strftime("%Y-%m-%dT%H:%M:00")
        rows.append([timestamp_str, value])

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    values = [int(r[1]) for r in rows[1:]]
    tir = sum(1 for v in values if 70 <= v <= 180) / len(values) * 100
    hyper = sum(1 for v in values if v > 180) / len(values) * 100
    hypo = sum(1 for v in values if v < 70) / len(values) * 100
    avg_glucose = sum(values) / len(values)

    print("-" * 30)
    print(f"Wygenerowano pomyślnie: {filename}")
    print(f"Liczba odczytów: {len(values)} ({days} dni)")
    print(f"Średnia glikemia: {avg_glucose:.0f} mg/dL")
    print(f"TIR (70-180):  {tir:.1f}%")
    print(f"Wysokie (>180): {hyper:.1f}%")
    print(f"Niskie (<70):   {hypo:.1f}%")
    print("-" * 30)

if __name__ == "__main__":
    generate_cgm_data(days=30, interval_min=5, filename="../public/cgm-data.csv")