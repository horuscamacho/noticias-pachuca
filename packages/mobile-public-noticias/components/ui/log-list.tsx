import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { LegendList, type LegendListRef } from '@legendapp/list';
import { Check, Loader2, AlertCircle } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import type { LogItem } from '@/src/types/outlet.types';

interface LogListProps {
  logs: LogItem[];
  maxHeight?: number;
  autoScroll?: boolean;
}

const LogList = forwardRef<LegendListRef, LogListProps>(
  ({ logs, maxHeight = 400, autoScroll = true }, ref) => {
    const renderLogItem = ({ item }: { item: LogItem }) => {
      const getIcon = () => {
        switch (item.type) {
          case 'success':
            return <Check size={16} color="#22C55E" />;
          case 'loading':
            return <Loader2 size={16} color="#EAB308" />;
          case 'error':
            return <AlertCircle size={16} color="#EF4444" />;
          case 'info':
            return null;
          default:
            return null;
        }
      };

      const getTextColor = () => {
        switch (item.type) {
          case 'success':
            return 'text-green-600';
          case 'loading':
            return 'text-yellow-600';
          case 'error':
            return 'text-red-600';
          case 'info':
            return 'text-muted-foreground';
          default:
            return 'text-muted-foreground';
        }
      };

      return (
        <View className="flex-row items-start gap-2 py-1.5 px-3">
          {getIcon()}
          <Text className={`text-sm flex-1 ${getTextColor()}`}>
            {item.message}
          </Text>
        </View>
      );
    };

    return (
      <View className="bg-muted/30 rounded-lg overflow-hidden" style={{ maxHeight }}>
        <LegendList
          ref={ref}
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          maintainScrollAtEnd={autoScroll}
          maintainScrollAtEndThreshold={0.1}
          recycleItems={false}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      </View>
    );
  }
);

LogList.displayName = 'LogList';

export { LogList };
