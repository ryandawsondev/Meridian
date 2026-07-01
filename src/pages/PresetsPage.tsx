import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import DayPresetList from '../components/presets/DayPresetList'
import SectionPresetList from '../components/presets/SectionPresetList'
import WeekPresetList from '../components/presets/WeekPresetList'

export default function PresetsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Presets</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Build section presets, compose them into day templates, then build week schedules.
      </p>
      <Tabs defaultValue="day">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="day" className="flex-1">
            Day Presets
          </TabsTrigger>
          <TabsTrigger value="section" className="flex-1">
            Section Presets
          </TabsTrigger>
          <TabsTrigger value="week" className="flex-1">
            Week Presets
          </TabsTrigger>
        </TabsList>
        <TabsContent value="day">
          <DayPresetList />
        </TabsContent>
        <TabsContent value="section">
          <SectionPresetList />
        </TabsContent>
        <TabsContent value="week">
          <WeekPresetList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
