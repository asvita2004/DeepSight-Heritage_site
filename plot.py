
import matplotlib.pyplot as plt
import numpy as np

models = ['Kaldi-ASR', 'DeepSpeech', 'wav2vec 2.0', 'Elsa Speak', 'PhonoMetric (Proposed)']

accuracy = [0.78, 0.81, 0.76, 0.79, 0.88]
precision = [0.75, 0.80, 0.74, 0.77, 0.86]
recall = [0.77, 0.79, 0.73, 0.78, 0.87]
f1_score = [0.76, 0.79, 0.73, 0.77, 0.86]

metrics = [accuracy, precision, recall, f1_score]
metric_names = ['Accuracy', 'Precision', 'Recall', 'F1 Score']
colors = ['skyblue', 'orange', 'green', 'purple', 'red']

x = np.arange(len(models))

plt.figure(figsize=(12, 8))

for i, metric in enumerate(metrics):
    plt.subplot(2, 2, i+1)
    bars = plt.bar(x, metric, color=colors)
    plt.xticks(x, models, rotation=30)
    plt.ylim(0, 1.0)
    plt.ylabel(metric_names[i])
    plt.title(f'{metric_names[i]} Comparison')
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.01, f'{yval:.2f}', ha='center', fontsize=9)

plt.tight_layout()
plt.show()
